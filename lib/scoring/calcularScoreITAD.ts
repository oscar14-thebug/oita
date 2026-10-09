import { prisma } from "@/lib/prisma";
import { resolverValorFinalIndicador } from "@/lib/scoring/resolverValorFinalIndicador";

export interface ScoreITAD {
  estado: "evaluado" | "sin_evaluar";
  scoreTotal: number | null;
  scorePorDimension: Record<string, number> | null;
  coberturaDocumental: number | null;
  distribucion: { "0": number; "1": number; "2": number; "3": number; na: number };
}

/**
 * Score ITAD de un sistema (SCRUM-12):
 *
 *   score = 100 * Σ(peso_indicador · valorFinal/3) / Σ(peso_indicador aplicable)
 *
 * "Aplicable" excluye los indicadores marcados N/A (`Puntuacion.esNoAplicable`) del
 * numerador y del denominador. El mismo criterio se aplica por dimensión, en escala 0-3.
 *
 * El valor final de un indicador se resuelve así:
 *   - Si existe `ControlCalidad` (doble evaluación ya adjudicada), se usa su `valorFinal`.
 *   - Si no existe pero hay exactamente UNA puntuación para ese indicador (un solo
 *     evaluador cargó ese indicador, sin discrepancia posible), se usa su `valor`
 *     directamente como final.
 *   - Si hay 2+ puntuaciones sin adjudicar todavía (discrepancia pendiente de
 *     resolución vía `resolverControlCalidad`), el indicador se excluye del cálculo
 *     hasta que se adjudique.
 *
 * Cobertura documental = % del peso aplicable cuyo indicador tiene valorFinal >= 1
 * Y al menos una fuente asociada (los indicadores en 0 se interpretan como "no hay
 * evidencia de cumplimiento", así que no suman a la cobertura aunque tengan fuentes).
 *
 * Si el sistema no tiene ninguna puntuación cargada todavía, devuelve
 * `estado: "sin_evaluar"` con los campos numéricos en null, sin lanzar error.
 */
export async function calcularScoreITAD(sistemaId: string): Promise<ScoreITAD> {
  const [indicadores, controlCalidad, puntuaciones] = await Promise.all([
    prisma.indicador.findMany({ where: { activo: true }, include: { dimension: true } }),
    prisma.controlCalidad.findMany({ where: { sistemaId } }),
    prisma.puntuacion.findMany({
      where: { sistemaId },
      include: { fuentesPuntuaciones: true },
    }),
  ]);

  if (controlCalidad.length === 0 && puntuaciones.length === 0) {
    return {
      estado: "sin_evaluar",
      scoreTotal: null,
      scorePorDimension: null,
      coberturaDocumental: null,
      distribucion: { "0": 0, "1": 0, "2": 0, "3": 0, na: 0 },
    };
  }

  const controlPorIndicador = new Map(controlCalidad.map((c) => [c.indicadorId, c]));
  const naIndicadores = new Set(
    puntuaciones.filter((p) => p.esNoAplicable).map((p) => p.indicadorId),
  );
  const indicadoresConFuente = new Set(
    puntuaciones.filter((p) => p.fuentesPuntuaciones.length > 0).map((p) => p.indicadorId),
  );
  const puntuacionesPorIndicador = new Map<string, typeof puntuaciones>();
  for (const p of puntuaciones) {
    const lista = puntuacionesPorIndicador.get(p.indicadorId) ?? [];
    lista.push(p);
    puntuacionesPorIndicador.set(p.indicadorId, lista);
  }

  const distribucion = { "0": 0, "1": 0, "2": 0, "3": 0, na: 0 };
  let sumaPonderada = 0;
  let pesoAplicable = 0;
  let pesoCubierto = 0;
  const acumDimension = new Map<string, { suma: number; peso: number }>();

  for (const indicador of indicadores) {
    if (naIndicadores.has(indicador.id)) {
      distribucion.na += 1;
      continue;
    }

    const control = controlPorIndicador.get(indicador.id);
    const lista = puntuacionesPorIndicador.get(indicador.id) ?? [];
    const resolucion = resolverValorFinalIndicador(lista, control);

    if (resolucion.valor === null) continue; // pendiente de adjudicar, o sin evaluar

    const valor = resolucion.valor;
    distribucion[String(valor) as "0" | "1" | "2" | "3"] += 1;

    sumaPonderada += indicador.pesoInterno * valor;
    pesoAplicable += indicador.pesoInterno;

    if (valor >= 1 && indicadoresConFuente.has(indicador.id)) {
      pesoCubierto += indicador.pesoInterno;
    }

    const acumulado = acumDimension.get(indicador.dimensionId) ?? { suma: 0, peso: 0 };
    acumulado.suma += indicador.pesoInterno * valor;
    acumulado.peso += indicador.pesoInterno;
    acumDimension.set(indicador.dimensionId, acumulado);
  }

  if (pesoAplicable === 0) {
    return {
      estado: "sin_evaluar",
      scoreTotal: null,
      scorePorDimension: null,
      coberturaDocumental: null,
      distribucion,
    };
  }

  const scoreTotal = Number(((sumaPonderada / pesoAplicable / 3) * 100).toFixed(2));
  const coberturaDocumental = Number(((pesoCubierto / pesoAplicable) * 100).toFixed(2));

  const scorePorDimension: Record<string, number> = {};
  for (const [dimensionId, { suma, peso }] of acumDimension) {
    scorePorDimension[dimensionId] = peso > 0 ? Number((suma / peso).toFixed(2)) : 0;
  }

  return {
    estado: "evaluado",
    scoreTotal,
    scorePorDimension,
    coberturaDocumental,
    distribucion,
  };
}

/**
 * Recalcula el score de un sistema y lo persiste en `sistema_score` (la tabla de
 * caché que lee `calcularResumenSistema`). Se invoca cada vez que se adjudica un
 * indicador (`resolverControlCalidad`), para que el catálogo (Inicio/Explorar, que
 * lee `sistema.score` directo, sin fallback al cálculo en vivo) no dependa de que
 * alguien vuelva a visitar la ficha individual para "calentar" la caché.
 *
 * Si el sistema todavía no tiene ningún indicador adjudicado (`estado: sin_evaluar`),
 * no escribe nada — evita persistir una fila con score 0 antes de que exista score real.
 */
export async function recalcularYGuardarScore(sistemaId: string): Promise<ScoreITAD> {
  const score = await calcularScoreITAD(sistemaId);

  if (score.estado === "sin_evaluar" || score.scoreTotal === null) {
    return score;
  }

  await prisma.sistemaScore.upsert({
    where: { sistemaId },
    create: {
      sistemaId,
      scoreTotal: score.scoreTotal,
      coberturaDocumental: score.coberturaDocumental ?? 0,
      distribucion0: score.distribucion["0"],
      distribucion1: score.distribucion["1"],
      distribucion2: score.distribucion["2"],
      distribucion3: score.distribucion["3"],
      distribucionNa: score.distribucion.na,
      puntuacionPorDimension: score.scorePorDimension ?? {},
    },
    update: {
      scoreTotal: score.scoreTotal,
      coberturaDocumental: score.coberturaDocumental ?? 0,
      distribucion0: score.distribucion["0"],
      distribucion1: score.distribucion["1"],
      distribucion2: score.distribucion["2"],
      distribucion3: score.distribucion["3"],
      distribucionNa: score.distribucion.na,
      puntuacionPorDimension: score.scorePorDimension ?? {},
      actualizadoEn: new Date(),
    },
  });

  return score;
}

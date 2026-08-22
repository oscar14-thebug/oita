import { prisma } from "@/lib/prisma";

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
 * `valorFinal` viene de `ControlCalidad` (post control de calidad), no de las
 * puntuaciones individuales de cada evaluador.
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
    if (!control) continue; // todavía sin evaluar / sin adjudicar

    const valor = control.valorFinal;
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

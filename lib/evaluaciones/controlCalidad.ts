import { prisma } from "@/lib/prisma";

export class ControlCalidadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface DiscrepanciaIndicador {
  indicadorId: string;
  indicador: string;
  primerEvaluador: { evaluadorId: string; valor: number | null; esNoAplicable: boolean };
  segundoEvaluador: { evaluadorId: string; valor: number | null; esNoAplicable: boolean };
  discrepancia: number | null;
  resuelto: boolean;
  valorFinal: number | null;
}

/**
 * Para cada indicador con 2+ puntuaciones registradas en el sistema, arma la
 * comparación primer/segundo evaluador. "Primero" y "segundo" son por orden de
 * llegada (fecha ascendente); si hay más de dos evaluadores solo se muestran los
 * dos primeros — el flujo de adjudicación (ver `resolverControlCalidad`) asume
 * doble evaluación, no N.
 */
export async function listarDiscrepancias(sistemaId: string): Promise<DiscrepanciaIndicador[]> {
  const [puntuaciones, controlExistente] = await Promise.all([
    prisma.puntuacion.findMany({
      where: { sistemaId },
      orderBy: { fecha: "asc" },
      include: { indicador: true },
    }),
    prisma.controlCalidad.findMany({ where: { sistemaId } }),
  ]);

  const porIndicador = new Map<string, typeof puntuaciones>();
  for (const puntuacion of puntuaciones) {
    const lista = porIndicador.get(puntuacion.indicadorId) ?? [];
    lista.push(puntuacion);
    porIndicador.set(puntuacion.indicadorId, lista);
  }

  const controlPorIndicador = new Map(controlExistente.map((c) => [c.indicadorId, c]));
  const resultado: DiscrepanciaIndicador[] = [];

  for (const [indicadorId, lista] of porIndicador) {
    if (lista.length < 2) continue;

    const [primero, segundo] = lista;
    const discrepancia =
      primero.valor !== null && segundo.valor !== null
        ? Math.abs(primero.valor - segundo.valor)
        : null;
    const control = controlPorIndicador.get(indicadorId);

    resultado.push({
      indicadorId,
      indicador: primero.indicador.nombre,
      primerEvaluador: {
        evaluadorId: primero.evaluadorId,
        valor: primero.valor,
        esNoAplicable: primero.esNoAplicable,
      },
      segundoEvaluador: {
        evaluadorId: segundo.evaluadorId,
        valor: segundo.valor,
        esNoAplicable: segundo.esNoAplicable,
      },
      discrepancia,
      resuelto: Boolean(control),
      valorFinal: control?.valorFinal ?? null,
    });
  }

  return resultado;
}

export interface ResolverControlCalidadInput {
  sistemaId: string;
  indicadorId: string;
  valorFinal: number;
  tercerRevisorId?: string | null;
  decisionAdjudicacion?: string | null;
}

/**
 * Adjudica el valor final de un indicador con doble evaluación. Si la discrepancia
 * entre el primer y segundo evaluador fue de 2 o 3 puntos, exige tercer_revisor_id
 * y decision_adjudicacion. Guarda (upsert) en `control_calidad` — el valor_final
 * resuelto acá es el que usa el cálculo de score (lib/scoring/calcularScoreITAD.ts),
 * no las puntuaciones individuales.
 */
export async function resolverControlCalidad(input: ResolverControlCalidadInput) {
  const puntuaciones = await prisma.puntuacion.findMany({
    where: { sistemaId: input.sistemaId, indicadorId: input.indicadorId },
    orderBy: { fecha: "asc" },
  });

  if (puntuaciones.length < 2) {
    throw new ControlCalidadError(
      "Este indicador no tiene al menos dos puntuaciones registradas para adjudicar.",
      409,
    );
  }

  const [primero, segundo] = puntuaciones;

  if (primero.valor === null || segundo.valor === null) {
    throw new ControlCalidadError(
      "No se puede adjudicar automáticamente: al menos una de las dos puntuaciones está " +
        "marcada como N/A. Resolver esta discrepancia manualmente.",
    );
  }

  const discrepancia = Math.abs(primero.valor - segundo.valor);

  if (discrepancia >= 2) {
    if (!input.tercerRevisorId || !input.decisionAdjudicacion?.trim()) {
      throw new ControlCalidadError(
        "Discrepancia de 2 o más puntos: tercer_revisor_id y decision_adjudicacion son obligatorios.",
      );
    }
  }

  return prisma.controlCalidad.upsert({
    where: {
      sistemaId_indicadorId: { sistemaId: input.sistemaId, indicadorId: input.indicadorId },
    },
    update: {
      primerEvaluadorId: primero.evaluadorId,
      segundoEvaluadorId: segundo.evaluadorId,
      valor1: primero.valor,
      valor2: segundo.valor,
      discrepancia,
      valorFinal: input.valorFinal,
      tercerRevisorId: input.tercerRevisorId ?? null,
      decisionAdjudicacion: input.decisionAdjudicacion ?? null,
    },
    create: {
      sistemaId: input.sistemaId,
      indicadorId: input.indicadorId,
      primerEvaluadorId: primero.evaluadorId,
      segundoEvaluadorId: segundo.evaluadorId,
      valor1: primero.valor,
      valor2: segundo.valor,
      discrepancia,
      valorFinal: input.valorFinal,
      tercerRevisorId: input.tercerRevisorId ?? null,
      decisionAdjudicacion: input.decisionAdjudicacion ?? null,
    },
  });
}

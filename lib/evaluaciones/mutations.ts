import { prisma } from "@/lib/prisma";
import { validarPuntuacion } from "./reglas";

export class PuntuacionDuplicadaError extends Error {}

export interface CrearPuntuacionInput {
  sistemaId: string;
  indicadorId: string;
  valor: number | null;
  esNoAplicable: boolean;
  justificacionNa: string | null;
  notaJustificativa: string;
  evaluadorId: string;
  fuenteIds: string[];
}

function esErrorDeUnicidad(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Siempre inserta una fila nueva (nunca actualiza una existente): puede haber más de
 * un evaluador puntuando el mismo indicador — ver control_calidad (SCRUM-15) para cómo
 * se resuelve la discrepancia. El único caso en que se rechaza es que el MISMO
 * evaluador repita indicador+sistema (constraint única en el schema).
 */
export async function crearPuntuacion(input: CrearPuntuacionInput) {
  validarPuntuacion({
    valor: input.valor,
    esNoAplicable: input.esNoAplicable,
    justificacionNa: input.justificacionNa,
  });

  try {
    return await prisma.puntuacion.create({
      data: {
        sistemaId: input.sistemaId,
        indicadorId: input.indicadorId,
        valor: input.esNoAplicable ? null : input.valor,
        esNoAplicable: input.esNoAplicable,
        justificacionNa: input.esNoAplicable ? input.justificacionNa : null,
        notaJustificativa: input.notaJustificativa,
        evaluadorId: input.evaluadorId,
        fuentesPuntuaciones: {
          create: input.fuenteIds.map((fuenteId) => ({ fuenteId })),
        },
      },
      include: { fuentesPuntuaciones: true },
    });
  } catch (error) {
    if (esErrorDeUnicidad(error)) {
      throw new PuntuacionDuplicadaError(
        "Este evaluador ya registró una puntuación para este indicador en este sistema.",
      );
    }
    throw error;
  }
}

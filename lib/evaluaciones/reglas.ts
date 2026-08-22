/**
 * Reglas de negocio para registrar puntuaciones (Sistema × Indicador × Evaluador).
 * Ver prisma/schema.prisma → modelo Puntuacion.
 */

export class ReglaEvaluacionError extends Error {}

export interface DatosPuntuacion {
  valor: number | null;
  esNoAplicable: boolean;
  justificacionNa: string | null;
}

/**
 * `justificacion_na` es obligatoria cuando `es_no_aplicable` es true; y `valor`
 * es obligatorio cuando no lo es. Se valida en el límite de escritura porque
 * Prisma no expresa CHECK constraints condicionales de forma declarativa.
 */
export function validarPuntuacion(datos: DatosPuntuacion): void {
  if (datos.esNoAplicable) {
    if (!datos.justificacionNa || !datos.justificacionNa.trim()) {
      throw new ReglaEvaluacionError(
        "justificacion_na es obligatoria cuando es_no_aplicable es true.",
      );
    }
    return;
  }

  if (datos.valor === null || datos.valor === undefined) {
    throw new ReglaEvaluacionError("valor es obligatorio cuando la puntuación no es N/A.");
  }

  if (datos.valor < 0 || datos.valor > 3) {
    throw new ReglaEvaluacionError("valor debe estar entre 0 y 3.");
  }
}

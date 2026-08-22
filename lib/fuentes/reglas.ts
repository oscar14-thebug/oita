import { NivelFuente } from "@/lib/generated/prisma/client";

export class FuenteInvalidaError extends Error {}

const NIVELES_VALIDOS = Object.values(NivelFuente);

export function validarNivel(nivel: string): asserts nivel is NivelFuente {
  if (!NIVELES_VALIDOS.includes(nivel as NivelFuente)) {
    throw new FuenteInvalidaError(`nivel debe ser uno de: ${NIVELES_VALIDOS.join(", ")}.`);
  }
}

/** fecha_consulta no puede ser futura (se permite cualquier hora del día de hoy). */
export function validarFechaConsulta(fechaConsulta: Date): void {
  if (Number.isNaN(fechaConsulta.getTime())) {
    throw new FuenteInvalidaError("fecha_consulta no es una fecha válida.");
  }

  const finDeHoy = new Date();
  finDeHoy.setHours(23, 59, 59, 999);

  if (fechaConsulta.getTime() > finDeHoy.getTime()) {
    throw new FuenteInvalidaError("fecha_consulta no puede ser futura.");
  }
}

import { EstadoSistema } from "@/lib/generated/prisma/client";
import { CRITERIOS_ELEGIBILIDAD } from "./elegibilidad";

export class SistemaInvalidoError extends Error {}

const ESTADOS_VALIDOS = Object.values(EstadoSistema);

export function validarEstado(estado: string): asserts estado is EstadoSistema {
  if (!ESTADOS_VALIDOS.includes(estado as EstadoSistema)) {
    throw new SistemaInvalidoError(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}.`);
  }
}

export function validarIdentificacion(input: {
  nombreOficial: string;
  institucionId: string;
  finalidad: string;
  proceso: string;
  usuariosDescripcion: string;
  gradoAutomatizacion: string;
}): void {
  // Ojo: no iterar Object.entries(input) — quien llama puede pasar un objeto más
  // grande (DatosSistema completo) con campos opcionales (versionSistema,
  // poblacionAfectada, elegibilidadJustificacion) que no deben validarse acá.
  const CAMPOS_OBLIGATORIOS = [
    "nombreOficial",
    "institucionId",
    "finalidad",
    "proceso",
    "usuariosDescripcion",
    "gradoAutomatizacion",
  ] as const;

  for (const campo of CAMPOS_OBLIGATORIOS) {
    const valor = input[campo];
    if (!valor || !valor.trim()) {
      throw new SistemaInvalidoError(`${campo} es obligatorio.`);
    }
  }
}

export interface RespuestaElegibilidad {
  cumple: boolean;
  justificacion: string;
}

export type ElegibilidadJustificacion = Partial<Record<string, RespuestaElegibilidad>>;

/**
 * Un borrador puede guardarse con el checklist incompleto (por eso cada criterio es
 * opcional acá); lo que se valida es que, si un criterio viene respondido, tenga la
 * forma { cumple: boolean, justificacion: string }.
 */
export function validarElegibilidad(valor: unknown): asserts valor is ElegibilidadJustificacion {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new SistemaInvalidoError("elegibilidadJustificacion debe ser un objeto.");
  }

  const objeto = valor as Record<string, unknown>;

  for (const criterio of CRITERIOS_ELEGIBILIDAD) {
    const respuesta = objeto[criterio.id];
    if (respuesta === undefined) continue;

    const esValida =
      typeof respuesta === "object" &&
      respuesta !== null &&
      typeof (respuesta as Record<string, unknown>).cumple === "boolean" &&
      typeof (respuesta as Record<string, unknown>).justificacion === "string";

    if (!esValida) {
      throw new SistemaInvalidoError(
        `La respuesta del criterio "${criterio.id}" debe tener { cumple: boolean, justificacion: string }.`,
      );
    }
  }
}

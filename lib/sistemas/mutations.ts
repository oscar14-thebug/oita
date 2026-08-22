import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { validarEstado, validarIdentificacion, validarElegibilidad } from "./reglas";

export class SistemaNoEncontradoError extends Error {}

/** Marca una ficha como publicada en el catálogo público. Solo admin/editor (ver ruta). */
export async function publicarSistema(sistemaId: string) {
  try {
    return await prisma.sistema.update({
      where: { id: sistemaId },
      data: { publicado: true },
    });
  } catch {
    throw new SistemaNoEncontradoError(`No se encontró un sistema con id "${sistemaId}".`);
  }
}

export interface CrearInstitucionInput {
  nombre: string;
  pais: string;
  sector: string;
}

export async function crearInstitucion(input: CrearInstitucionInput) {
  return prisma.institucion.create({ data: input });
}

export interface DatosSistema {
  nombreOficial: string;
  institucionId: string;
  versionSistema?: string | null;
  estado: string;
  finalidad: string;
  proceso: string;
  usuariosDescripcion: string;
  poblacionAfectada?: string | null;
  gradoAutomatizacion: string;
  elegibilidadJustificacion?: unknown;
}

/** Crea un sistema como borrador (publicado: false); se publica aparte (SCRUM-16). */
export async function crearSistema(input: DatosSistema) {
  validarEstado(input.estado);
  validarIdentificacion(input);
  if (input.elegibilidadJustificacion !== undefined) {
    validarElegibilidad(input.elegibilidadJustificacion);
  }

  const version = await prisma.versionMetodologia.findFirstOrThrow({
    orderBy: { fechaEfectiva: "desc" },
  });

  return prisma.sistema.create({
    data: {
      nombreOficial: input.nombreOficial,
      institucionId: input.institucionId,
      versionSistema: input.versionSistema ?? null,
      estado: input.estado,
      finalidad: input.finalidad,
      proceso: input.proceso,
      usuariosDescripcion: input.usuariosDescripcion,
      poblacionAfectada: input.poblacionAfectada ?? null,
      gradoAutomatizacion: input.gradoAutomatizacion,
      elegibilidadJustificacion: (input.elegibilidadJustificacion ?? {}) as Prisma.InputJsonValue,
      versionMetodologiaId: version.id,
    },
  });
}

/** Actualiza los campos editables de un sistema (borrador o publicado). */
export async function actualizarSistema(id: string, input: Partial<DatosSistema>) {
  if (input.estado !== undefined) validarEstado(input.estado);
  if (input.elegibilidadJustificacion !== undefined) {
    validarElegibilidad(input.elegibilidadJustificacion);
  }

  const data: Prisma.SistemaUncheckedUpdateInput = {
    fechaUltimaRevision: new Date(),
    ...(input.nombreOficial !== undefined && { nombreOficial: input.nombreOficial }),
    ...(input.institucionId !== undefined && { institucionId: input.institucionId }),
    ...(input.versionSistema !== undefined && { versionSistema: input.versionSistema }),
    ...(input.estado !== undefined && { estado: input.estado }),
    ...(input.finalidad !== undefined && { finalidad: input.finalidad }),
    ...(input.proceso !== undefined && { proceso: input.proceso }),
    ...(input.usuariosDescripcion !== undefined && {
      usuariosDescripcion: input.usuariosDescripcion,
    }),
    ...(input.poblacionAfectada !== undefined && { poblacionAfectada: input.poblacionAfectada }),
    ...(input.gradoAutomatizacion !== undefined && {
      gradoAutomatizacion: input.gradoAutomatizacion,
    }),
    ...(input.elegibilidadJustificacion !== undefined && {
      elegibilidadJustificacion: input.elegibilidadJustificacion as Prisma.InputJsonValue,
    }),
  };

  try {
    return await prisma.sistema.update({ where: { id }, data });
  } catch {
    throw new SistemaNoEncontradoError(`No se encontró un sistema con id "${id}".`);
  }
}

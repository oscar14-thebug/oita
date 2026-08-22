import { NextResponse } from "next/server";
import { getSistemaDetalle } from "@/lib/sistemas/queries";
import { actualizarSistema } from "@/lib/sistemas/mutations";
import {
  obtenerUsuarioActual,
  obtenerUsuarioActualOpcional,
  puedeVerBorradores,
} from "@/lib/auth/sesion";
import { manejarErrorApi } from "@/lib/http/errores";

/**
 * Público, pero si el sistema es un borrador (publicado: false) solo lo devuelve
 * cuando la sesión actual es admin/editor — igual que la página /sistemas/[id].
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const usuario = await obtenerUsuarioActualOpcional();
  const sistema = await getSistemaDetalle(id, { incluirBorrador: puedeVerBorradores(usuario) });

  if (!sistema) {
    return NextResponse.json(
      { error: `No se encontró un sistema con id "${id}".` },
      { status: 404 },
    );
  }

  return NextResponse.json(sistema);
}

/** Actualiza los campos editables de un sistema (borrador o publicado). Requiere sesión. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await obtenerUsuarioActual();
    const body = await request.json();

    const sistema = await actualizarSistema(id, {
      ...(body.nombre_oficial !== undefined && { nombreOficial: body.nombre_oficial }),
      ...(body.institucion_id !== undefined && { institucionId: body.institucion_id }),
      ...(body.version_sistema !== undefined && { versionSistema: body.version_sistema }),
      ...(body.estado !== undefined && { estado: body.estado }),
      ...(body.finalidad !== undefined && { finalidad: body.finalidad }),
      ...(body.proceso !== undefined && { proceso: body.proceso }),
      ...(body.usuarios_descripcion !== undefined && {
        usuariosDescripcion: body.usuarios_descripcion,
      }),
      ...(body.poblacion_afectada !== undefined && { poblacionAfectada: body.poblacion_afectada }),
      ...(body.grado_automatizacion !== undefined && {
        gradoAutomatizacion: body.grado_automatizacion,
      }),
      ...(body.elegibilidad_justificacion !== undefined && {
        elegibilidadJustificacion: body.elegibilidad_justificacion,
      }),
    });

    return NextResponse.json(sistema);
  } catch (error) {
    return manejarErrorApi(error);
  }
}

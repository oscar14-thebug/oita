import { NextRequest, NextResponse } from "next/server";
import { listSistemas } from "@/lib/sistemas/queries";
import { crearSistema } from "@/lib/sistemas/mutations";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { manejarErrorApi } from "@/lib/http/errores";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const resultado = await listSistemas({
    pais: searchParams.get("pais") ?? undefined,
    sector: searchParams.get("sector") ?? undefined,
    institucionId: searchParams.get("institucionId") ?? undefined,
    texto: searchParams.get("texto") ?? undefined,
    limit: limitParam ? Number(limitParam) : undefined,
    offset: offsetParam ? Number(offsetParam) : undefined,
  });

  return NextResponse.json(resultado);
}

/** Crea un sistema como borrador (publicado: false). Requiere sesión activa. */
export async function POST(request: Request) {
  try {
    await obtenerUsuarioActual();
    const body = await request.json();

    const sistema = await crearSistema({
      nombreOficial: body.nombre_oficial,
      institucionId: body.institucion_id,
      versionSistema: body.version_sistema ?? null,
      estado: body.estado,
      finalidad: body.finalidad,
      proceso: body.proceso,
      usuariosDescripcion: body.usuarios_descripcion,
      poblacionAfectada: body.poblacion_afectada ?? null,
      gradoAutomatizacion: body.grado_automatizacion,
      elegibilidadJustificacion: body.elegibilidad_justificacion,
    });

    return NextResponse.json(sistema, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

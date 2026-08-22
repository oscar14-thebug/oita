import { NextResponse } from "next/server";
import { obtenerUsuarioActual, requerirRol } from "@/lib/auth/sesion";
import { RolUsuario } from "@/lib/generated/prisma/client";
import { crearFuente } from "@/lib/fuentes/mutations";
import { listarFuentesPorSistema } from "@/lib/fuentes/queries";
import { manejarErrorApi } from "@/lib/http/errores";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fuentes = await listarFuentesPorSistema(id);
  return NextResponse.json({ data: fuentes });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const usuario = await obtenerUsuarioActual();
    requerirRol(usuario, [RolUsuario.analista, RolUsuario.editor, RolUsuario.admin]);

    const body = await request.json();

    const fuente = await crearFuente({
      sistemaId: id,
      urlOIdentificador: body.url_o_identificador,
      titulo: body.titulo,
      entidadEmisora: body.entidad_emisora,
      fechaPublicacion: body.fecha_publicacion ?? null,
      fechaConsulta: body.fecha_consulta,
      nivel: body.nivel,
      fragmento: body.fragmento,
      versionSistemaReferida: body.version_sistema_referida ?? null,
      notas: body.notas ?? null,
      analistaId: usuario.id,
    });

    return NextResponse.json(fuente, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

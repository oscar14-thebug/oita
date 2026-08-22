import { NextResponse } from "next/server";
import { obtenerUsuarioActual, requerirRol } from "@/lib/auth/sesion";
import { RolUsuario } from "@/lib/generated/prisma/client";
import { publicarSistema } from "@/lib/sistemas/mutations";
import { manejarErrorApi } from "@/lib/http/errores";

/** Solo admin y editor pueden publicar una ficha en el catálogo público (SCRUM-16). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const usuario = await obtenerUsuarioActual();
    requerirRol(usuario, [RolUsuario.admin, RolUsuario.editor]);

    const sistema = await publicarSistema(id);
    return NextResponse.json(sistema);
  } catch (error) {
    return manejarErrorApi(error);
  }
}

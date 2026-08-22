import { NextResponse } from "next/server";
import { listarInstitucionesTodas } from "@/lib/sistemas/queries";
import { crearInstitucion } from "@/lib/sistemas/mutations";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { manejarErrorApi } from "@/lib/http/errores";

/** Lista todas las instituciones (backoffice — no filtra por publicado). */
export async function GET() {
  const instituciones = await listarInstitucionesTodas();
  return NextResponse.json({ data: instituciones });
}

/** Crea una institución nueva. Requiere sesión activa. */
export async function POST(request: Request) {
  try {
    await obtenerUsuarioActual();
    const body = await request.json();

    const institucion = await crearInstitucion({
      nombre: body.nombre,
      pais: body.pais,
      sector: body.sector,
    });

    return NextResponse.json(institucion, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

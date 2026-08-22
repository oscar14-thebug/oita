import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { crearPuntuacion } from "@/lib/evaluaciones/mutations";
import { manejarErrorApi } from "@/lib/http/errores";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const usuario = await obtenerUsuarioActual();
    const body = await request.json();

    const puntuacion = await crearPuntuacion({
      sistemaId: id,
      indicadorId: body.indicador_id,
      valor: body.valor ?? null,
      esNoAplicable: Boolean(body.es_no_aplicable),
      justificacionNa: body.justificacion_na ?? null,
      notaJustificativa: body.nota_justificativa,
      evaluadorId: usuario.id,
      fuenteIds: Array.isArray(body.fuente_id) ? body.fuente_id : [],
    });

    return NextResponse.json(puntuacion, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

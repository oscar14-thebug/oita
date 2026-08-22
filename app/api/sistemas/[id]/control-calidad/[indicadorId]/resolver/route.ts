import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { resolverControlCalidad } from "@/lib/evaluaciones/controlCalidad";
import { manejarErrorApi } from "@/lib/http/errores";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; indicadorId: string }> },
) {
  const { id, indicadorId } = await params;

  try {
    // Requiere sesión activa; SCRUM-16 define qué rol exactamente puede adjudicar.
    await obtenerUsuarioActual();

    const body = await request.json();

    const controlCalidad = await resolverControlCalidad({
      sistemaId: id,
      indicadorId,
      valorFinal: body.valor_final,
      tercerRevisorId: body.tercer_revisor_id ?? null,
      decisionAdjudicacion: body.decision_adjudicacion ?? null,
    });

    return NextResponse.json(controlCalidad, { status: 200 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

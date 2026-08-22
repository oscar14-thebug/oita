import { NextResponse } from "next/server";
import { listarDiscrepancias } from "@/lib/evaluaciones/controlCalidad";
import { manejarErrorApi } from "@/lib/http/errores";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const discrepancias = await listarDiscrepancias(id);
    return NextResponse.json({ data: discrepancias });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

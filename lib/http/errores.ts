import { NextResponse } from "next/server";
import { SesionError } from "@/lib/auth/sesion";
import { ReglaEvaluacionError } from "@/lib/evaluaciones/reglas";
import { FuenteInvalidaError } from "@/lib/fuentes/reglas";
import { PuntuacionDuplicadaError } from "@/lib/evaluaciones/mutations";
import { ControlCalidadError } from "@/lib/evaluaciones/controlCalidad";
import { SistemaNoEncontradoError } from "@/lib/sistemas/mutations";
import { SistemaInvalidoError } from "@/lib/sistemas/reglas";

/** Traduce errores de dominio conocidos al código HTTP correspondiente. */
export function manejarErrorApi(error: unknown): NextResponse {
  if (error instanceof SesionError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (
    error instanceof ReglaEvaluacionError ||
    error instanceof FuenteInvalidaError ||
    error instanceof SistemaInvalidoError
  ) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof ControlCalidadError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof PuntuacionDuplicadaError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof SistemaNoEncontradoError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
}

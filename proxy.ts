import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

/**
 * El sitio público (catálogo, fichas, comparador, ranking) no requiere login.
 * Solo /backoffice/* redirige a /login si no hay sesión activa (SCRUM-16).
 * La protección de los endpoints de escritura (POST fuentes/puntuaciones/
 * control-calidad) vive en cada route handler, vía lib/auth/sesion.ts.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await actualizarSesion(request);

  if (request.nextUrl.pathname.startsWith("/backoffice") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)"],
};

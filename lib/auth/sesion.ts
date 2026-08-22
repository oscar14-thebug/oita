import { prisma } from "@/lib/prisma";
import { RolUsuario } from "@/lib/generated/prisma/client";
import { createClient } from "@/lib/supabase/server";

export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export class SesionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Lee la sesión activa de Supabase Auth (cookies de la request actual) y la resuelve
 * contra la tabla `usuarios`. Requiere que exista una fila en `usuarios` con el MISMO
 * id que el usuario de Supabase Auth — ver README, sección "Aprovisionar usuarios".
 */
export async function obtenerUsuarioActual(): Promise<UsuarioSesion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new SesionError("No hay sesión activa.", 401);
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: user.id } });
  if (!usuario) {
    throw new SesionError(
      "La sesión es válida pero no existe un usuario correspondiente en la tabla usuarios.",
      403,
    );
  }

  return usuario;
}

/**
 * Igual que obtenerUsuarioActual, pero devuelve null en vez de lanzar cuando no hay
 * sesión (o no hay fila espejo en `usuarios`). Para rutas públicas que necesitan
 * saber "quién mira, si alguien" sin exigir estar logueado — p.ej. permitir que
 * admin/editor vean un sistema en borrador desde la ficha pública.
 */
export async function obtenerUsuarioActualOpcional(): Promise<UsuarioSesion | null> {
  try {
    return await obtenerUsuarioActual();
  } catch (error) {
    if (error instanceof SesionError) return null;
    throw error;
  }
}

/** true si el usuario (o la ausencia de sesión) puede ver fichas en borrador. */
export function puedeVerBorradores(usuario: UsuarioSesion | null): boolean {
  return usuario?.rol === RolUsuario.admin || usuario?.rol === RolUsuario.editor;
}

export function requerirRol(usuario: UsuarioSesion, roles: RolUsuario[]): void {
  if (!roles.includes(usuario.rol)) {
    throw new SesionError(
      `Rol "${usuario.rol}" no autorizado para esta acción (requiere: ${roles.join(", ")}).`,
      403,
    );
  }
}

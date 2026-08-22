import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listarSistemasBackoffice } from "@/lib/sistemas/queries";
import { CerrarSesionButton } from "./cerrar-sesion-button";

export default async function BackofficePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [usuario, sistemas] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: user.id } }),
    listarSistemasBackoffice(),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Backoffice OITA</h1>
        <CerrarSesionButton />
      </div>

      {usuario ? (
        <p className="text-sm text-neutral-500">
          Sesión activa: <strong className="text-neutral-900">{usuario.nombre}</strong> (
          {usuario.email}) — rol <strong className="text-neutral-900">{usuario.rol}</strong>
        </p>
      ) : (
        <p className="text-sm text-amber-700">
          Hay una sesión de Supabase Auth activa ({user.email}), pero no existe una fila
          correspondiente en la tabla <code>usuarios</code> (mismo id). Ver README:
          &quot;Aprovisionar usuarios&quot;.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sistemas</h2>
        <Button asChild>
          <Link href="/backoffice/sistemas/nuevo">+ Nuevo sistema</Link>
        </Button>
      </div>

      {sistemas.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay sistemas cargados.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {sistemas.map((sistema) => (
            <li key={sistema.id} className="flex items-center justify-between p-4">
              <div>
                <Link
                  href={`/backoffice/sistemas/${sistema.id}/editar`}
                  className="font-medium hover:underline"
                >
                  {sistema.nombreOficial}
                </Link>
                <p className="text-sm text-neutral-500">{sistema.institucion.nombre}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {sistema.estado}
                </Badge>
                <Badge variant={sistema.publicado ? "default" : "secondary"}>
                  {sistema.publicado ? "Publicado" : "Borrador"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

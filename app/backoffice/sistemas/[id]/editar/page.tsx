import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerSistemaParaEditar, listarInstitucionesTodas } from "@/lib/sistemas/queries";
import { EditorFicha } from "@/components/editor-ficha";

interface EditarPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarSistemaPage({ params }: EditarPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [sistema, instituciones] = await Promise.all([
    obtenerSistemaParaEditar(id, user.id),
    listarInstitucionesTodas(),
  ]);

  if (!sistema) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <EditorFicha sistema={sistema} instituciones={instituciones} />
    </main>
  );
}

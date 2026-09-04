"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IdentificacionContextoForm,
  type DatosIdentificacionContexto,
  type InstitucionOpcion,
} from "@/components/identificacion-contexto-form";

const VALORES_INICIALES: DatosIdentificacionContexto = {
  nombreOficial: "",
  institucionId: "",
  versionSistema: "",
  estado: "candidato",
  finalidad: "",
  proceso: "",
  usuariosDescripcion: "",
  poblacionAfectada: "",
  gradoAutomatizacion: "",
};

export default function NuevoSistemaPage() {
  const router = useRouter();
  const [instituciones, setInstituciones] = useState<InstitucionOpcion[]>([]);

  useEffect(() => {
    fetch("/api/instituciones")
      .then((res) => res.json())
      .then((body) => setInstituciones(body.data ?? []));
  }, []);

  async function crearSistema(datos: DatosIdentificacionContexto) {
    const res = await fetch("/api/sistemas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_oficial: datos.nombreOficial,
        institucion_id: datos.institucionId,
        version_sistema: datos.versionSistema || null,
        estado: datos.estado,
        finalidad: datos.finalidad,
        proceso: datos.proceso,
        usuarios_descripcion: datos.usuariosDescripcion,
        poblacion_afectada: datos.poblacionAfectada || null,
        grado_automatizacion: datos.gradoAutomatizacion,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "No se pudo crear el sistema.");
    }

    const sistema = await res.json();
    router.push(`/backoffice/sistemas/${sistema.id}/editar`);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Nuevo sistema</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Se guarda como borrador. Las secciones de Elegibilidad, Fuentes y Puntuaciones se completan
        después de crearlo.
      </p>
      <IdentificacionContextoForm
        valoresIniciales={VALORES_INICIALES}
        instituciones={instituciones}
        onGuardar={crearSistema}
        textoBoton="Crear borrador"
      />
    </main>
  );
}

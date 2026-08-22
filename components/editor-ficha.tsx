"use client";

import { useState } from "react";
import Link from "next/link";
import type { obtenerSistemaParaEditar } from "@/lib/sistemas/queries";
import type { InstitucionOpcion as InstitucionOpcionQuery } from "@/lib/sistemas/queries";
import {
  IdentificacionContextoForm,
  type DatosIdentificacionContexto,
} from "@/components/identificacion-contexto-form";
import { ElegibilidadChecklist, type ElegibilidadValor } from "@/components/elegibilidad-checklist";
import { EditorFuentes } from "@/components/editor-fuentes";
import { EditorPuntuaciones } from "@/components/editor-puntuaciones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SistemaParaEditar = NonNullable<Awaited<ReturnType<typeof obtenerSistemaParaEditar>>>;

async function patchSistema(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/sistemas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const respuesta = await res.json();
    throw new Error(respuesta.error ?? "No se pudo guardar.");
  }
  return res.json();
}

export function EditorFicha({
  sistema,
  instituciones,
}: {
  sistema: SistemaParaEditar;
  instituciones: InstitucionOpcionQuery[];
}) {
  const [publicado, setPublicado] = useState(sistema.publicado);
  const [elegibilidad, setElegibilidad] = useState<ElegibilidadValor>(
    (sistema.elegibilidadJustificacion as ElegibilidadValor) ?? {},
  );
  const [fuentes, setFuentes] = useState(sistema.fuentes);
  const [indicadores, setIndicadores] = useState(sistema.indicadores);

  const [mensajeElegibilidad, setMensajeElegibilidad] = useState<string | null>(null);
  const [guardandoElegibilidad, setGuardandoElegibilidad] = useState(false);
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  const valoresIniciales: DatosIdentificacionContexto = {
    nombreOficial: sistema.nombreOficial,
    institucionId: sistema.institucionId,
    versionSistema: sistema.versionSistema ?? "",
    estado: sistema.estado,
    finalidad: sistema.finalidad,
    proceso: sistema.proceso,
    usuariosDescripcion: sistema.usuariosDescripcion,
    poblacionAfectada: sistema.poblacionAfectada ?? "",
    gradoAutomatizacion: sistema.gradoAutomatizacion,
  };

  async function guardarIdentificacionContexto(datos: DatosIdentificacionContexto) {
    await patchSistema(sistema.id, {
      nombre_oficial: datos.nombreOficial,
      institucion_id: datos.institucionId,
      version_sistema: datos.versionSistema || null,
      estado: datos.estado,
      finalidad: datos.finalidad,
      proceso: datos.proceso,
      usuarios_descripcion: datos.usuariosDescripcion,
      poblacion_afectada: datos.poblacionAfectada || null,
      grado_automatizacion: datos.gradoAutomatizacion,
    });
  }

  async function guardarElegibilidad() {
    setGuardandoElegibilidad(true);
    setMensajeElegibilidad(null);
    try {
      await patchSistema(sistema.id, { elegibilidad_justificacion: elegibilidad });
      setMensajeElegibilidad("Guardado.");
    } catch (err) {
      setMensajeElegibilidad(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setGuardandoElegibilidad(false);
    }
  }

  async function publicar() {
    setPublicando(true);
    setErrorPublicar(null);
    try {
      const res = await fetch(`/api/sistemas/${sistema.id}/publicar`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "No se pudo publicar.");
      }
      setPublicado(true);
    } catch (err) {
      setErrorPublicar(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{sistema.nombreOficial}</h1>
          <Badge variant={publicado ? "default" : "secondary"} className="mt-2">
            {publicado ? "Publicado" : "Borrador"}
          </Badge>
        </div>
        <div className="flex flex-col items-end gap-2">
          {publicado && (
            <Link href={`/sistemas/${sistema.id}`} className="text-sm hover:underline">
              Ver ficha pública
            </Link>
          )}
          {!publicado && (
            <Button onClick={publicar} disabled={publicando}>
              {publicando ? "Publicando..." : "Publicar"}
            </Button>
          )}
          {errorPublicar && <p className="text-sm text-red-600">{errorPublicar}</p>}
        </div>
      </div>

      <IdentificacionContextoForm
        valoresIniciales={valoresIniciales}
        instituciones={instituciones}
        onGuardar={guardarIdentificacionContexto}
        textoBoton="Guardar identificación y contexto"
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">2. Elegibilidad</h2>
        <ElegibilidadChecklist value={elegibilidad} onChange={setElegibilidad} />
        <div className="flex items-center gap-3">
          <Button onClick={guardarElegibilidad} disabled={guardandoElegibilidad}>
            {guardandoElegibilidad ? "Guardando..." : "Guardar elegibilidad"}
          </Button>
          {mensajeElegibilidad && <p className="text-sm text-neutral-500">{mensajeElegibilidad}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">4. Fuentes</h2>
        <EditorFuentes
          sistemaId={sistema.id}
          fuentes={fuentes}
          onFuenteCreada={(f) => setFuentes([f, ...fuentes])}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">5. Puntuaciones</h2>
        <EditorPuntuaciones
          sistemaId={sistema.id}
          indicadores={indicadores}
          fuentes={fuentes}
          onPuntuacionCreada={(indicadorId, miPuntuacion) =>
            setIndicadores((prev) =>
              prev.map((ind) => (ind.id === indicadorId ? { ...ind, miPuntuacion } : ind)),
            )
          }
        />
      </section>
    </div>
  );
}

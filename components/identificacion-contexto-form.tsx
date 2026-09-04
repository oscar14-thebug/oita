"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mismos valores que el enum EstadoSistema del schema — hardcodeado acá para no
// importar el cliente Prisma generado (pesado) en un componente de cliente.
const ESTADOS = ["candidato", "investigacion", "elegibilidad", "evaluacion_itad", "revision", "publicacion", "actualizacion"] as const;

export interface InstitucionOpcion {
  id: string;
  nombre: string;
  pais: string;
  sector: string;
}

export interface DatosIdentificacionContexto {
  nombreOficial: string;
  institucionId: string;
  versionSistema: string;
  estado: string;
  finalidad: string;
  proceso: string;
  usuariosDescripcion: string;
  poblacionAfectada: string;
  gradoAutomatizacion: string;
}

export function IdentificacionContextoForm({
  valoresIniciales,
  instituciones,
  onGuardar,
  textoBoton,
}: {
  valoresIniciales: DatosIdentificacionContexto;
  instituciones: InstitucionOpcion[];
  onGuardar: (datos: DatosIdentificacionContexto) => Promise<void>;
  textoBoton: string;
}) {
  const [datos, setDatos] = useState(valoresIniciales);
  const [institucionNueva, setInstitucionNueva] = useState(false);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [nuevaPais, setNuevaPais] = useState("");
  const [nuevaSector, setNuevaSector] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof DatosIdentificacionContexto>(
    campo: K,
    valor: DatosIdentificacionContexto[K],
  ) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      let institucionId = datos.institucionId;

      if (institucionNueva) {
        const res = await fetch("/api/instituciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nuevaNombre, pais: nuevaPais, sector: nuevaSector }),
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "No se pudo crear la institución.");
        }
        const institucion = await res.json();
        institucionId = institucion.id;
      }

      await onGuardar({ ...datos, institucionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Identificación */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">1. Identificación</h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nombreOficial">Nombre oficial</Label>
          <Input
            id="nombreOficial"
            value={datos.nombreOficial}
            onChange={(e) => set("nombreOficial", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Institución</Label>
          {!institucionNueva ? (
            <div className="flex items-center gap-2">
              <Select value={datos.institucionId} onValueChange={(v) => set("institucionId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map((institucion) => (
                    <SelectItem key={institucion.id} value={institucion.id}>
                      {institucion.nombre} ({institucion.pais})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInstitucionNueva(true)}
                className="shrink-0"
              >
                + Nueva
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
              <Input
                placeholder="Nombre de la institución"
                value={nuevaNombre}
                onChange={(e) => setNuevaNombre(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Input
                  placeholder="País (ISO-2, ej. AR)"
                  value={nuevaPais}
                  onChange={(e) => setNuevaPais(e.target.value.toUpperCase())}
                  maxLength={2}
                  required
                />
                <Input
                  placeholder="Sector"
                  value={nuevaSector}
                  onChange={(e) => setNuevaSector(e.target.value)}
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInstitucionNueva(false)}
                className="self-start"
              >
                Usar institución existente
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="versionSistema">Versión del sistema</Label>
            <Input
              id="versionSistema"
              value={datos.versionSistema}
              onChange={(e) => set("versionSistema", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <Select value={datos.estado} onValueChange={(v) => set("estado", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado} className="capitalize">
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Contexto */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">3. Contexto</h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="finalidad">Finalidad</Label>
          <Textarea
            id="finalidad"
            value={datos.finalidad}
            onChange={(e) => set("finalidad", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="proceso">Proceso</Label>
          <Textarea
            id="proceso"
            value={datos.proceso}
            onChange={(e) => set("proceso", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="usuariosDescripcion">Quién usa el sistema</Label>
          <Textarea
            id="usuariosDescripcion"
            value={datos.usuariosDescripcion}
            onChange={(e) => set("usuariosDescripcion", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="poblacionAfectada">Población afectada (opcional)</Label>
          <Textarea
            id="poblacionAfectada"
            value={datos.poblacionAfectada}
            onChange={(e) => set("poblacionAfectada", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="gradoAutomatizacion">Grado de automatización</Label>
          <Input
            id="gradoAutomatizacion"
            placeholder="consultivo / recomendador / decisorio"
            value={datos.gradoAutomatizacion}
            onChange={(e) => set("gradoAutomatizacion", e.target.value)}
            required
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={guardando} className="self-start">
        {guardando ? "Guardando..." : textoBoton}
      </Button>
    </form>
  );
}

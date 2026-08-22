"use client";

import { useState } from "react";
import type { obtenerSistemaParaEditar } from "@/lib/sistemas/queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatearFechaCalendario } from "@/lib/ui/fechas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SistemaParaEditar = NonNullable<Awaited<ReturnType<typeof obtenerSistemaParaEditar>>>;
export type FuenteEditor = SistemaParaEditar["fuentes"][number];

const NIVELES = ["A", "B", "C", "D"] as const;

const FORM_VACIO = {
  urlOIdentificador: "",
  titulo: "",
  entidadEmisora: "",
  fechaPublicacion: "",
  fechaConsulta: new Date().toISOString().slice(0, 10),
  nivel: "A" as string,
  fragmento: "",
  versionSistemaReferida: "",
  notas: "",
};

export function EditorFuentes({
  sistemaId,
  fuentes,
  onFuenteCreada,
}: {
  sistemaId: string;
  fuentes: FuenteEditor[];
  onFuenteCreada: (fuente: FuenteEditor) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof FORM_VACIO>(campo: K, valor: (typeof FORM_VACIO)[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      const res = await fetch(`/api/sistemas/${sistemaId}/fuentes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url_o_identificador: form.urlOIdentificador,
          titulo: form.titulo,
          entidad_emisora: form.entidadEmisora,
          fecha_publicacion: form.fechaPublicacion || null,
          fecha_consulta: form.fechaConsulta,
          nivel: form.nivel,
          fragmento: form.fragmento,
          version_sistema_referida: form.versionSistemaReferida || null,
          notas: form.notas || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "No se pudo crear la fuente.");
      }

      const fuente: FuenteEditor = await res.json();
      onFuenteCreada(fuente);
      setForm(FORM_VACIO);
      setAbierto(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {fuentes.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay fuentes registradas.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {fuentes.map((fuente) => (
            <li key={fuente.id} className="flex items-center gap-3 p-3 text-sm">
              <Badge variant="outline">{fuente.nivel}</Badge>
              <span className="flex-1">{fuente.titulo}</span>
              <span className="text-neutral-500">
                {formatearFechaCalendario(fuente.fechaConsulta)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!abierto ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setAbierto(true)}
          className="self-start"
        >
          + Agregar fuente
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="fuente-url">URL o identificador</Label>
            <Input
              id="fuente-url"
              value={form.urlOIdentificador}
              onChange={(e) => set("urlOIdentificador", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fuente-titulo">Título</Label>
            <Input
              id="fuente-titulo"
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuente-entidad">Entidad emisora</Label>
              <Input
                id="fuente-entidad"
                value={form.entidadEmisora}
                onChange={(e) => set("entidadEmisora", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Nivel</Label>
              <Select value={form.nivel} onValueChange={(v) => set("nivel", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {nivel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuente-fecha-pub">Fecha de publicación (opcional)</Label>
              <Input
                id="fuente-fecha-pub"
                type="date"
                value={form.fechaPublicacion}
                onChange={(e) => set("fechaPublicacion", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuente-fecha-consulta">Fecha de consulta</Label>
              <Input
                id="fuente-fecha-consulta"
                type="date"
                value={form.fechaConsulta}
                onChange={(e) => set("fechaConsulta", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fuente-fragmento">Fragmento citado</Label>
            <Textarea
              id="fuente-fragmento"
              value={form.fragmento}
              onChange={(e) => set("fragmento", e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar fuente"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

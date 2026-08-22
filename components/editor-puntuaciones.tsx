"use client";

import { useState } from "react";
import type { obtenerSistemaParaEditar } from "@/lib/sistemas/queries";
import type { FuenteEditor } from "@/components/editor-fuentes";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SistemaParaEditar = NonNullable<Awaited<ReturnType<typeof obtenerSistemaParaEditar>>>;
export type IndicadorEditorItem = SistemaParaEditar["indicadores"][number];
type MiPuntuacion = NonNullable<IndicadorEditorItem["miPuntuacion"]>;

function FilaIndicador({
  sistemaId,
  indicador,
  fuentes,
  onPuntuacionCreada,
}: {
  sistemaId: string;
  indicador: IndicadorEditorItem;
  fuentes: FuenteEditor[];
  onPuntuacionCreada: (indicadorId: string, miPuntuacion: MiPuntuacion) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState<number | null>(null);
  const [esNoAplicable, setEsNoAplicable] = useState(false);
  const [justificacionNa, setJustificacionNa] = useState("");
  const [notaJustificativa, setNotaJustificativa] = useState("");
  const [fuenteIds, setFuenteIds] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (indicador.miPuntuacion) {
    const mp = indicador.miPuntuacion;
    return (
      <div className="flex items-center justify-between border-b border-neutral-200 p-3 text-sm">
        <p className="text-neutral-900">
          <span className="mr-2 font-mono text-xs text-neutral-500">{indicador.id}</span>
          {indicador.nombre}
        </p>
        <Badge variant="outline">{mp.esNoAplicable ? "N/A" : mp.valor}</Badge>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!esNoAplicable && valor === null) {
      setError("Selecciona un valor de 0 a 3, o marcá N/A.");
      return;
    }
    if (esNoAplicable && !justificacionNa.trim()) {
      setError("La justificación es obligatoria cuando marcás N/A.");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/sistemas/${sistemaId}/puntuaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indicador_id: indicador.id,
          valor: esNoAplicable ? null : valor,
          es_no_aplicable: esNoAplicable,
          justificacion_na: esNoAplicable ? justificacionNa : null,
          nota_justificativa: notaJustificativa,
          fuente_id: fuenteIds,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "No se pudo guardar la puntuación.");
      }

      onPuntuacionCreada(indicador.id, {
        valor: esNoAplicable ? null : valor,
        esNoAplicable,
        justificacionNa: esNoAplicable ? justificacionNa : null,
        notaJustificativa,
        fuenteIds,
      });
      setAbierto(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="border-b border-neutral-200 p-3">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex w-full items-center justify-between text-left text-sm font-medium"
      >
        <span>
          <span className="mr-2 font-mono text-xs text-neutral-500">{indicador.id}</span>
          {indicador.nombre}
        </span>
        <span className="text-neutral-500">{abierto ? "−" : "+"}</span>
      </button>

      {abierto && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-neutral-500">{indicador.preguntaEvaluativa}</p>

          <div className="flex flex-wrap items-center gap-2">
            {[0, 1, 2, 3].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setValor(v);
                  setEsNoAplicable(false);
                }}
                className={`h-8 w-8 rounded-full border text-sm ${
                  !esNoAplicable && valor === v
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-neutral-200"
                }`}
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setEsNoAplicable(true);
                setValor(null);
              }}
              className={`rounded-full border px-3 py-1 text-sm ${
                esNoAplicable ? "border-teal-500 bg-teal-500 text-white" : "border-neutral-200"
              }`}
            >
              N/A
            </button>
          </div>

          {esNoAplicable && (
            <Textarea
              placeholder="Justificación de N/A"
              value={justificacionNa}
              onChange={(e) => setJustificacionNa(e.target.value)}
            />
          )}

          <Textarea
            placeholder="Nota justificativa"
            value={notaJustificativa}
            onChange={(e) => setNotaJustificativa(e.target.value)}
            required
          />

          {fuentes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-neutral-500">Fuentes que sustentan esta puntuación</p>
              {fuentes.map((fuente) => (
                <label key={fuente.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fuenteIds.includes(fuente.id)}
                    onChange={(e) =>
                      setFuenteIds((prev) =>
                        e.target.checked
                          ? [...prev, fuente.id]
                          : prev.filter((id) => id !== fuente.id),
                      )
                    }
                  />
                  {fuente.titulo}
                </label>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={guardando} className="self-start">
            {guardando ? "Guardando..." : "Guardar puntuación"}
          </Button>
        </form>
      )}
    </div>
  );
}

export function EditorPuntuaciones({
  sistemaId,
  indicadores,
  fuentes,
  onPuntuacionCreada,
}: {
  sistemaId: string;
  indicadores: IndicadorEditorItem[];
  fuentes: FuenteEditor[];
  onPuntuacionCreada: (indicadorId: string, miPuntuacion: MiPuntuacion) => void;
}) {
  const porDimension = new Map<string, { nombre: string; filas: IndicadorEditorItem[] }>();
  for (const indicador of indicadores) {
    const grupo = porDimension.get(indicador.dimensionId) ?? {
      nombre: indicador.dimension,
      filas: [],
    };
    grupo.filas.push(indicador);
    porDimension.set(indicador.dimensionId, grupo);
  }

  return (
    <div className="rounded-lg border border-neutral-200">
      {Array.from(porDimension.entries()).map(([dimensionId, grupo]) => (
        <div key={dimensionId}>
          <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-500 uppercase">
            {grupo.nombre}
          </div>
          {grupo.filas.map((indicador) => (
            <FilaIndicador
              key={indicador.id}
              sistemaId={sistemaId}
              indicador={indicador}
              fuentes={fuentes}
              onPuntuacionCreada={onPuntuacionCreada}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

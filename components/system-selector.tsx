"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MAX_SISTEMAS = 4;

interface ResultadoBusqueda {
  id: string;
  nombreOficial: string;
  institucion: { nombre: string };
}

interface SistemaSeleccionado {
  id: string;
  nombreOficial: string;
}

export function SystemSelector({ seleccionados }: { seleccionados: SistemaSeleccionado[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    // Si texto está vacío, no hay nada que buscar; el dropdown ya se oculta en el
    // render (más abajo) sin necesidad de limpiar `resultados` acá.
    if (!texto.trim()) return;

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/sistemas?texto=${encodeURIComponent(texto)}&limit=6`, {
          signal: controller.signal,
        });
        const body = await res.json();
        setResultados(body.data ?? []);
      } catch {
        // Búsqueda cancelada o fallida: se ignora, no hay resultado que mostrar.
      } finally {
        setBuscando(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [texto]);

  const actualizarSeleccion = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length > 0) {
        params.set("ids", ids.join(","));
      } else {
        params.delete("ids");
      }
      router.push(`/comparar?${params.toString()}`);
    },
    [router, searchParams],
  );

  function agregar(sistema: ResultadoBusqueda) {
    if (seleccionados.some((s) => s.id === sistema.id)) return;
    if (seleccionados.length >= MAX_SISTEMAS) return;
    actualizarSeleccion([...seleccionados.map((s) => s.id), sistema.id]);
    setTexto("");
    setResultados([]);
  }

  function quitar(id: string) {
    actualizarSeleccion(seleccionados.filter((s) => s.id !== id).map((s) => s.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {seleccionados.map((sistema) => (
          <Badge key={sistema.id} variant="secondary" className="gap-2">
            {sistema.nombreOficial}
            <button
              type="button"
              onClick={() => quitar(sistema.id)}
              aria-label={`Quitar ${sistema.nombreOficial}`}
              className="hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>

      {seleccionados.length < MAX_SISTEMAS && (
        <div className="relative max-w-md">
          <Input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar un sistema para comparar..."
          />
          {texto.trim() && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-md">
              {buscando ? (
                <p className="p-3 text-sm text-neutral-500">Buscando...</p>
              ) : resultados.length === 0 ? (
                <p className="p-3 text-sm text-neutral-500">Sin resultados.</p>
              ) : (
                resultados.map((sistema) => (
                  <button
                    key={sistema.id}
                    type="button"
                    onClick={() => agregar(sistema)}
                    disabled={seleccionados.some((s) => s.id === sistema.id)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <span className="font-medium text-neutral-900">{sistema.nombreOficial}</span>
                    <span className="text-xs text-neutral-500">{sistema.institucion.nombre}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Elegí entre 2 y {MAX_SISTEMAS} sistemas ({seleccionados.length}/{MAX_SISTEMAS}).
      </p>
    </div>
  );
}

"use client";

import { CRITERIOS_ELEGIBILIDAD } from "@/lib/sistemas/elegibilidad";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface RespuestaElegibilidad {
  cumple: boolean;
  justificacion: string;
}

export type ElegibilidadValor = Partial<Record<string, RespuestaElegibilidad>>;

export function ElegibilidadChecklist({
  value,
  onChange,
}: {
  value: ElegibilidadValor;
  onChange: (valor: ElegibilidadValor) => void;
}) {
  function actualizar(criterioId: string, cambios: Partial<RespuestaElegibilidad>) {
    const actual = value[criterioId] ?? { cumple: false, justificacion: "" };
    onChange({ ...value, [criterioId]: { ...actual, ...cambios } });
  }

  return (
    <div className="flex flex-col gap-6">
      {CRITERIOS_ELEGIBILIDAD.map((criterio) => {
        const respuesta = value[criterio.id] ?? { cumple: false, justificacion: "" };
        return (
          <div key={criterio.id} className="rounded-lg border border-neutral-200 p-4">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutral-900">{criterio.titulo}</p>
                <p className="text-sm text-neutral-500">{criterio.pregunta}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={respuesta.cumple}
                  onChange={(e) => actualizar(criterio.id, { cumple: e.target.checked })}
                />
                Cumple
              </label>
            </div>
            <Label htmlFor={`justificacion-${criterio.id}`} className="text-xs">
              Justificación
            </Label>
            <Textarea
              id={`justificacion-${criterio.id}`}
              value={respuesta.justificacion}
              onChange={(e) => actualizar(criterio.id, { justificacion: e.target.value })}
              rows={2}
            />
          </div>
        );
      })}
    </div>
  );
}

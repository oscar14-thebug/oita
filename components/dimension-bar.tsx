import { getScoreBand } from "@/lib/ui/getScoreBand";
import type { DimensionFicha } from "@/lib/sistemas/queries";

const FILL_CLASSES = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
} as const;

export function DimensionBar({ dimension }: { dimension: DimensionFicha }) {
  const { valorPromedio } = dimension;
  const porcentaje = valorPromedio !== null ? (valorPromedio / 3) * 100 : 0;
  const color = valorPromedio !== null ? getScoreBand(porcentaje).color : null;

  return (
    <div className="flex items-center gap-4">
      <div className="w-56 shrink-0 text-sm font-medium text-neutral-900">
        {dimension.nombre} <span className="font-normal text-neutral-500">({dimension.peso}%)</span>
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
        {valorPromedio !== null && (
          <div
            className={`h-full rounded-full ${FILL_CLASSES[color!]}`}
            style={{ width: `${porcentaje}%` }}
          />
        )}
      </div>
      <div className="w-20 shrink-0 text-right text-sm text-neutral-500">
        {valorPromedio !== null ? `${valorPromedio.toFixed(1)} / 3.0` : "Sin evaluar"}
      </div>
    </div>
  );
}

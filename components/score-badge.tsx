import { getScoreBand } from "@/lib/ui/getScoreBand";

const BAND_CLASSES = {
  success: "border-success-500 text-success-500",
  warning: "border-warning-500 text-warning-500",
  danger: "border-danger-500 text-danger-500",
} as const;

const SIZE_CLASSES = {
  sm: "h-12 w-12 border-2 text-sm",
  lg: "h-24 w-24 border-4 text-2xl",
} as const;

export function ScoreBadge({ score, size = "sm" }: { score: number | null; size?: "sm" | "lg" }) {
  if (score === null) {
    return (
      <div
        className={`flex items-center justify-center rounded-full border-neutral-200 font-bold text-neutral-500 ${SIZE_CLASSES[size]}`}
      >
        —
      </div>
    );
  }

  const band = getScoreBand(score);

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${SIZE_CLASSES[size]} ${BAND_CLASSES[band.color]}`}
    >
      {Math.round(score)}
    </div>
  );
}

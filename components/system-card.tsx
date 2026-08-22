import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { getScoreBand } from "@/lib/ui/getScoreBand";
import type { SistemaListItem } from "@/lib/sistemas/queries";

export function SystemCard({ sistema }: { sistema: SistemaListItem }) {
  const band = sistema.scoreTotal !== null ? getScoreBand(sistema.scoreTotal) : null;

  return (
    <Link href={`/sistemas/${sistema.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Badge variant="outline">{sistema.institucion.pais}</Badge>
            <Badge variant="outline">{sistema.perfil.gradoAutomatizacion}</Badge>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900">{sistema.nombreOficial}</h3>
            <p className="text-sm text-neutral-500">{sistema.institucion.nombre}</p>
          </div>

          <div className="mt-auto flex items-center gap-3 pt-2">
            <ScoreBadge score={sistema.scoreTotal} />
            {band ? (
              <span className="text-sm capitalize">Transparencia {band.nivel}</span>
            ) : (
              <span className="text-sm text-neutral-500">Sin evaluar todavía</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getScoreBand } from "@/lib/ui/getScoreBand";
import type { PuntuacionFicha } from "@/lib/sistemas/queries";

const BADGE_CLASSES = {
  success: "border-success-500 text-success-500",
  warning: "border-warning-500 text-warning-500",
  danger: "border-danger-500 text-danger-500",
} as const;

function PillPuntuacion({
  valor,
  esNoAplicable,
}: {
  valor: number | null;
  esNoAplicable: boolean;
}) {
  if (esNoAplicable) {
    return (
      <Badge variant="outline" className="text-neutral-500">
        N/A
      </Badge>
    );
  }

  if (valor === null) {
    return (
      <Badge variant="outline" className="text-neutral-500">
        Sin evaluar
      </Badge>
    );
  }

  const band = getScoreBand((valor / 3) * 100);

  return (
    <Badge variant="outline" className={BADGE_CLASSES[band.color]}>
      {valor}
    </Badge>
  );
}

export function IndicadoresTable({ puntuaciones }: { puntuaciones: PuntuacionFicha[] }) {
  const porDimension = new Map<string, { nombre: string; filas: PuntuacionFicha[] }>();

  for (const p of puntuaciones) {
    const grupo = porDimension.get(p.dimensionId) ?? { nombre: p.dimension, filas: [] };
    grupo.filas.push(p);
    porDimension.set(p.dimensionId, grupo);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">ID</TableHead>
          <TableHead>Pregunta evaluativa</TableHead>
          <TableHead className="w-28 text-right">Fuentes</TableHead>
          <TableHead className="w-28 text-right">Puntuación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from(porDimension.entries()).map(([dimensionId, grupo]) => (
          <Fragment key={dimensionId}>
            <TableRow className="bg-neutral-50">
              <TableCell colSpan={4} className="text-xs font-semibold text-neutral-500 uppercase">
                {grupo.nombre}
              </TableCell>
            </TableRow>
            {grupo.filas.map((fila) => (
              <TableRow key={fila.indicadorId}>
                <TableCell className="font-mono text-xs text-neutral-500">
                  {fila.indicadorId}
                </TableCell>
                <TableCell>{fila.preguntaEvaluativa}</TableCell>
                <TableCell className="text-right">{fila.fuentes.length}</TableCell>
                <TableCell className="text-right">
                  <PillPuntuacion valor={fila.valorFinal} esNoAplicable={fila.esNoAplicable} />
                </TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

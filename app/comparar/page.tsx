import { Suspense } from "react";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { SystemSelector } from "@/components/system-selector";
import { ComparadorRadar } from "@/components/comparador-radar";
import { ScoreBadge } from "@/components/score-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSistemaDetalle } from "@/lib/sistemas/queries";

const MAX_SISTEMAS = 4;

interface ComparadorPageProps {
  searchParams: Promise<{ ids?: string | string[] }>;
}

export default async function ComparadorPage({ searchParams }: ComparadorPageProps) {
  const raw = await searchParams;
  const idsParam = Array.isArray(raw.ids) ? raw.ids[0] : raw.ids;
  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SISTEMAS);

  const crudos = await Promise.all(ids.map((id) => getSistemaDetalle(id)));
  const sistemas = crudos.filter((s): s is NonNullable<typeof s> => s !== null);

  const seleccionados = sistemas.map((s) => ({ id: s.id, nombreOficial: s.nombreOficial }));
  const dimensionesBase = sistemas[0]?.dimensiones ?? [];

  const radarData = dimensionesBase.map((dim, idx) => {
    const fila: Record<string, string | number> = { dimension: dim.nombre };
    sistemas.forEach((sistema, i) => {
      fila[`sistema${i}`] = sistema.dimensiones[idx]?.valorPromedio ?? 0;
    });
    return fila;
  });

  const series = sistemas.map((sistema, i) => ({
    key: `sistema${i}`,
    nombre: sistema.nombreOficial,
  }));

  return (
    <>
      <NavBar />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">Comparar sistemas</h1>
          <p className="mb-6 text-neutral-500">
            Elegí de 2 a {MAX_SISTEMAS} sistemas publicados para comparar su puntuación por
            dimensión.
          </p>

          <Suspense>
            <SystemSelector seleccionados={seleccionados} />
          </Suspense>

          {sistemas.length < 2 ? (
            <p className="mt-10 text-neutral-500">
              {ids.length > 0 && sistemas.length < ids.length
                ? "Alguno de los sistemas seleccionados ya no está disponible. "
                : ""}
              Selecciona al menos 2 sistemas para ver la comparación.
            </p>
          ) : (
            <>
              <div className="mt-10">
                <ComparadorRadar data={radarData} series={series} />
              </div>

              <div className="mt-10 overflow-x-auto rounded-lg border border-neutral-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dimensión</TableHead>
                      {sistemas.map((sistema) => (
                        <TableHead key={sistema.id}>{sistema.nombreOficial}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dimensionesBase.map((dim, idx) => (
                      <TableRow key={dim.id}>
                        <TableCell className="text-neutral-500">{dim.nombre}</TableCell>
                        {sistemas.map((sistema) => {
                          const valor = sistema.dimensiones[idx]?.valorPromedio ?? null;
                          return (
                            <TableCell key={sistema.id}>
                              {valor !== null ? `${valor.toFixed(1)} / 3.0` : "Sin evaluar"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    <TableRow className="bg-neutral-50 font-semibold">
                      <TableCell>Score total</TableCell>
                      {sistemas.map((sistema) => (
                        <TableCell key={sistema.id}>
                          <ScoreBadge score={sistema.resumen.scoreTotal} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

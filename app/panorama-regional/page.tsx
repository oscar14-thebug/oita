import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ScoreBadge } from "@/components/score-badge";
import { PanoramaBarChart } from "@/components/panorama-bar-chart";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  obtenerPanoramaRegional,
  obtenerOpcionesFiltro,
  obtenerDimensiones,
} from "@/lib/sistemas/queries";

interface PanoramaRegionalPageProps {
  searchParams: Promise<{
    pais?: string | string[];
    sector?: string | string[];
    dimensionId?: string | string[];
    orden?: string | string[];
  }>;
}

function primero(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
}

function Estadistica({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-neutral-900">{valor}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}

export default async function PanoramaRegionalPage({ searchParams }: PanoramaRegionalPageProps) {
  const raw = await searchParams;
  const pais = primero(raw.pais);
  const sector = primero(raw.sector);
  const dimensionId = primero(raw.dimensionId);
  const orden: "asc" | "desc" = primero(raw.orden) === "asc" ? "asc" : "desc";

  const [panorama, opciones, dimensiones] = await Promise.all([
    obtenerPanoramaRegional({
      pais: pais || undefined,
      sector: sector || undefined,
      dimensionId: dimensionId || undefined,
      orden,
    }),
    obtenerOpcionesFiltro(),
    obtenerDimensiones(),
  ]);

  function construirUrlOrden(nuevoOrden: "asc" | "desc") {
    const params = new URLSearchParams();
    if (pais) params.set("pais", pais);
    if (sector) params.set("sector", sector);
    if (dimensionId) params.set("dimensionId", dimensionId);
    params.set("orden", nuevoOrden);
    return `/panorama-regional?${params.toString()}`;
  }

  const dimensionActual = dimensiones.find((d) => d.id === dimensionId);
  const etiquetaScore = dimensionActual ? dimensionActual.nombre : "Score total";

  return (
    <>
      <NavBar />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">Panorama regional</h1>
          <p className="mb-8 text-neutral-500">
            Vista agregada de los sistemas publicados en el catálogo, con filtros y contexto — no es
            un ranking de &quot;mejores algoritmos&quot;.
          </p>

          {/* Filtros */}
          <form action="/panorama-regional" className="mb-8 flex flex-wrap items-center gap-3">
            <select
              name="pais"
              defaultValue={pais}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">País</option>
              {opciones.paises.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              name="sector"
              defaultValue={sector}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Sector</option>
              {opciones.sectores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              name="dimensionId"
              defaultValue={dimensionId}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Score total (todas las dimensiones)</option>
              {dimensiones.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>

            <input type="hidden" name="orden" value={orden} />
            <Button type="submit">Filtrar</Button>
          </form>

          {panorama.filas.length === 0 ? (
            <p className="text-neutral-500">
              No hay sistemas publicados que coincidan con estos filtros.
            </p>
          ) : (
            <>
              {/* Promedios y distribución */}
              <div className="mb-10 grid grid-cols-2 gap-6 border-y border-neutral-200 py-8 sm:grid-cols-4">
                <Estadistica valor={panorama.filas.length} label="Sistemas en la vista" />
                <Estadistica
                  valor={panorama.promedioScore ?? 0}
                  label={`${etiquetaScore} promedio`}
                />
                <Estadistica valor={panorama.distribucionBandas.alta} label="Transparencia alta" />
                <Estadistica
                  valor={panorama.distribucionBandas.intermedia}
                  label="Transparencia intermedia"
                />
              </div>

              {/* Gráfico de barras por país */}
              {panorama.promedioPorPais.length > 0 && (
                <div className="mb-10">
                  <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                    {etiquetaScore} promedio por país
                  </h2>
                  <PanoramaBarChart data={panorama.promedioPorPais} />
                </div>
              )}

              {/* Tabla ordenable */}
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Institución</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">
                        {/* <a> normal (no next/link): evita servir una versión cacheada
                            del cliente cuando solo cambia el orden por query param. */}
                        <a
                          href={construirUrlOrden(orden === "asc" ? "desc" : "asc")}
                          className="inline-flex items-center gap-1 hover:text-neutral-900"
                        >
                          {etiquetaScore} {orden === "asc" ? "↑" : "↓"}
                        </a>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panorama.filas.map((fila) => (
                      <TableRow key={fila.id}>
                        <TableCell>
                          <Link href={`/sistemas/${fila.id}`} className="hover:underline">
                            {fila.nombreOficial}
                          </Link>
                        </TableCell>
                        <TableCell className="text-neutral-500">
                          {fila.institucion.nombre}
                        </TableCell>
                        <TableCell>{fila.institucion.pais}</TableCell>
                        <TableCell className="capitalize">{fila.institucion.sector}</TableCell>
                        <TableCell className="text-right">
                          <ScoreBadge score={fila.score} />
                        </TableCell>
                      </TableRow>
                    ))}
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

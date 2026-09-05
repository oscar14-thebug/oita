import Link from "next/link";
import { notFound } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ScoreBadge } from "@/components/score-badge";
import { DimensionBar } from "@/components/dimension-bar";
import { IndicadoresTable } from "@/components/indicadores-table";
import { Badge } from "@/components/ui/badge";
import { getSistemaDetalle } from "@/lib/sistemas/queries";
import { obtenerUsuarioActualOpcional, puedeVerBorradores } from "@/lib/auth/sesion";
import { getScoreBand } from "@/lib/ui/getScoreBand";
import type { FuenteResumen } from "@/lib/fuentes/queries";
import { formatearFechaHora, formatearFechaCalendario } from "@/lib/ui/fechas";

const BAND_TEXT_CLASSES = {
  success: "text-success-500",
  warning: "text-warning-500",
  danger: "text-danger-500",
} as const;

function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface SistemaPageProps {
  params: Promise<{ id: string }>;
}

export default async function SistemaPage({ params }: SistemaPageProps) {
  const { id } = await params;

  // Regla de acceso (SCRUM-16/18): un borrador (publicado: false) solo es visible
  // para una sesión con rol admin/editor; para cualquier otro caso, 404.
  const usuario = await obtenerUsuarioActualOpcional();
  const sistema = await getSistemaDetalle(id, { incluirBorrador: puedeVerBorradores(usuario) });

  if (!sistema) {
    notFound();
  }

  const fuentesCitadas = new Map<string, FuenteResumen>();
  for (const puntuacion of sistema.puntuaciones) {
    for (const fuente of puntuacion.fuentes) {
      fuentesCitadas.set(fuente.id, fuente);
    }
  }
  const listaFuentes = Array.from(fuentesCitadas.values()).sort((a, b) =>
    b.fechaConsulta.localeCompare(a.fechaConsulta),
  );

  const sinEvaluar = sistema.resumen.estado === "sin_evaluar";
  const band =
    sistema.resumen.scoreTotal !== null ? getScoreBand(sistema.resumen.scoreTotal) : null;

  return (
    <>
      <NavBar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-navy-900 px-6 py-10 text-white">
          <div className="mx-auto max-w-6xl">
            <nav className="mb-6 text-sm text-neutral-300">
              <Link href="/explorar" className="hover:text-white">
                Explorar
              </Link>{" "}
              / <span className="capitalize">{sistema.institucion.sector}</span> /{" "}
              <span className="text-white">{sistema.nombreOficial}</span>
            </nav>

            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/30 text-white">
                {sistema.institucion.pais}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white capitalize">
                {sistema.institucion.sector}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white capitalize">
                {sistema.estado}
              </Badge>
            </div>

            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-bold">{sistema.nombreOficial}</h1>
                <p className="mt-1 text-neutral-300">
                  {sistema.institucion.nombre} · Última revisión{" "}
                  {formatearFechaHora(sistema.fechaUltimaRevision)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ScoreBadge score={sistema.resumen.scoreTotal} size="lg" />
                <div className="text-sm">
                  {sinEvaluar || sistema.resumen.scoreTotal === null || !band ? (
                    <span className="text-neutral-300">Evaluación incompleta</span>
                  ) : (
                    <>
                      <p className="font-semibold">{sistema.resumen.scoreTotal}/100</p>
                      <p className={BAND_TEXT_CLASSES[band.color]}>Transparencia {band.nivel}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Puntuación por dimensión */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">
              Puntuación por dimensión
            </h2>
            {sinEvaluar ? (
              <p className="rounded-lg border border-neutral-200 p-6 text-neutral-500">
                Este sistema aún no tiene evaluación completa.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {sistema.dimensiones.map((dimension) => (
                  <DimensionBar key={dimension.id} dimension={dimension} />
                ))}
              </div>
            )}
          </section>

          {/* Información general */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Información general</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-neutral-200 p-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-500 uppercase">Finalidad</dt>
                <dd className="text-neutral-900">{sistema.finalidad}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500 uppercase">Proceso</dt>
                <dd className="text-neutral-900">{sistema.proceso}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500 uppercase">Usuarios del sistema</dt>
                <dd className="text-neutral-900">{sistema.usuariosDescripcion}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500 uppercase">Grado de automatización</dt>
                <dd className="text-neutral-900 capitalize">{sistema.gradoAutomatizacion}</dd>
              </div>
              {sistema.poblacionAfectada && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-neutral-500 uppercase">Población afectada</dt>
                  <dd className="text-neutral-900">{sistema.poblacionAfectada}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Indicadores */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Indicadores</h2>
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <IndicadoresTable puntuaciones={sistema.puntuaciones} />
            </div>
          </section>

          {/* Fuentes citadas */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Fuentes citadas</h2>
            {listaFuentes.length === 0 ? (
              <p className="text-neutral-500">
                Todavía no hay fuentes registradas para este sistema.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                {listaFuentes.map((fuente) => (
                  <li key={fuente.id} className="flex items-center gap-4 p-4">
                    <Badge variant="outline">{fuente.nivel}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">{fuente.titulo}</p>
                      <a
                        href={fuente.urlOIdentificador}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-500 hover:underline"
                      >
                        {dominioDe(fuente.urlOIdentificador)}
                      </a>
                    </div>
                    <span className="text-sm text-neutral-500">
                      {formatearFechaCalendario(fuente.fechaConsulta)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

      </main>
      <Footer />
    </>
  );
}

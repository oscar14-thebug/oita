import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { SystemCard } from "@/components/system-card";
import { ScoreBadge } from "@/components/score-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSistemas, obtenerEstadisticasCatalogo, getSistemaDetalle } from "@/lib/sistemas/queries";

// Sin searchParams ni otras APIs dinámicas, Next.js prerenderiza esta página como
// estática en build time — congelando stats y destacados. Se fuerza dinámica para
// que las estadísticas y sistemas destacados salgan siempre en vivo de la base.
export const dynamic = "force-dynamic";

const QUE_ES = [
  {
    titulo: "¿Qué es OITA?",
    texto:
      "OITA mide la transparencia algorítmica de sistemas automatizados del sector público a través del ITAD, un índice basado en 24 indicadores agrupados en 6 dimensiones.",
  },
  {
    titulo: "¿Para qué sirve?",
    texto:
      "Para que la ciudadanía pueda conocer, comparar y exigir mayor transparencia y rendición de cuentas en el uso de algoritmos que impactan derechos.",
  },
  {
    titulo: "¿A quién está dirigido?",
    texto:
      "Ciudadanía, periodistas, organizaciones civiles, investigadores, funcionarios públicos y tomadores de decisiones.",
  },
];

const COMO_FUNCIONA = [
  "Identificamos sistemas algorítmicos públicos y verificamos su elegibilidad.",
  "Evaluamos con el ITAD (24 indicadores) mediante doble evaluación independiente.",
  "Resolvemos discrepancias en control de calidad y asignamos una puntuación de 0 a 100.",
  "Publicamos resultados y la evidencia documental que los sustenta.",
];

const ARQUITECTURA = [
  "Fuentes públicas",
  "Recolección y curación",
  "Evaluación ITAD",
  "Base de datos",
  "Publicación en OITA",
];

const NAVEGACION = [
  { label: "Inicio", href: "/", descripcion: "Resumen general y sistemas destacados." },
  { label: "Explorar", href: "/explorar", descripcion: "Catálogo completo de sistemas, con filtros." },
  { label: "Comparar", href: "/comparar", descripcion: "Compará hasta 4 sistemas lado a lado." },
  {
    label: "Panorama regional",
    href: "/panorama-regional",
    descripcion: "Vista agregada por país, sector y dimensión.",
  },
  { label: "Metodología", href: "/metodologia", descripcion: "Los 24 indicadores ITAD y sus pesos." },
  { label: "Sobre OITA", href: "/sobre-oita", descripcion: "Quiénes somos y cómo trabajamos." },
  { label: "Recursos", href: "/recursos", descripcion: "Guías y materiales de referencia." },
];

const PRINCIPIOS = [
  "Acceso a información pública",
  "Rigurosidad metodológica",
  "No discriminación y derechos humanos",
  "Participación ciudadana",
  "Rendición de cuentas",
];

const TRANSPARENCIA_PASOS = [
  "Metodología abierta y pública",
  "Evidencia documental verificable por indicador",
  "Trazabilidad de las fuentes citadas",
  "Doble evaluación y control de calidad",
  "Historial de revisión de cada ficha",
];

function Estadistica({
  valor,
  label,
  compacto = false,
}: {
  valor: number | string;
  label: string;
  compacto?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`font-bold text-neutral-900 ${compacto ? "text-lg" : "text-3xl"}`}
      >
        {valor}
      </div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}

function MiniDimensionBar({
  id,
  valorPromedio,
}: {
  id: string;
  valorPromedio: number | null;
}) {
  const porcentaje = valorPromedio !== null ? (valorPromedio / 3) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-7 shrink-0 text-neutral-500">{id}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
        {valorPromedio !== null && (
          <div className="h-full rounded-full bg-teal-500" style={{ width: `${porcentaje}%` }} />
        )}
      </div>
      <span className="w-8 shrink-0 text-right text-neutral-500">
        {valorPromedio !== null ? valorPromedio.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export default async function Home() {
  const [destacados, estadisticas] = await Promise.all([
    listSistemas({ limit: 4 }),
    obtenerEstadisticasCatalogo(),
  ]);

  // Para los paneles "ejemplo" (ficha y comparación) usamos sistemas reales ya
  // publicados en vez de datos inventados — se toman los primeros del catálogo
  // en lugar de ids hardcodeados, para no quedar apuntando a un sistema que deje
  // de estar publicado.
  const idsEjemplo = destacados.data.slice(0, 2).map((s) => s.id);
  const detallesEjemplo = (await Promise.all(idsEjemplo.map((id) => getSistemaDetalle(id)))).filter(
    (s): s is NonNullable<typeof s> => s !== null,
  );
  const fichaEjemplo = detallesEjemplo[0] ?? null;
  const dimensionesBase = fichaEjemplo?.dimensiones ?? [];

  return (
    <>
      <NavBar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-navy-900 px-6 py-20 text-center text-white">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-balance">
            Transparencia algorítmica para democracias más fuertes
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-200">
            Evaluamos públicamente los sistemas de decisión automatizada que usan instituciones
            públicas de la región, con base en la metodología ITAD.
          </p>

          <form
            action="/explorar"
            className="mx-auto mt-8 flex max-w-xl overflow-hidden rounded-full bg-white"
          >
            <input
              type="text"
              name="texto"
              placeholder="Buscar por nombre de sistema o institución..."
              className="flex-1 px-5 py-3 text-sm text-neutral-900 outline-none"
            />
            <button
              type="submit"
              className="bg-teal-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Buscar
            </button>
          </form>
        </section>

        {/* Cuerpo: contexto | stats+destacados | ficha de ejemplo */}
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[260px_1fr_300px]">
          {/* Columna izquierda: contexto estático */}
          <aside className="flex flex-col gap-8">
            {QUE_ES.map((bloque) => (
              <div key={bloque.titulo}>
                <h3 className="mb-2 font-semibold text-neutral-900">{bloque.titulo}</h3>
                <p className="text-sm text-neutral-500">{bloque.texto}</p>
              </div>
            ))}
            <div>
              <h3 className="mb-2 font-semibold text-neutral-900">¿Cómo funciona?</h3>
              <ol className="flex flex-col gap-2 text-sm text-neutral-500">
                {COMO_FUNCIONA.map((paso, i) => (
                  <li key={paso} className="flex gap-2">
                    <span className="shrink-0 font-semibold text-teal-500">{i + 1}.</span>
                    {paso}
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Columna central: estadísticas reales + sistemas destacados */}
          <div>
            <section className="mb-12 grid grid-cols-2 gap-6 rounded-lg border border-neutral-200 px-6 py-8 sm:grid-cols-5">
              <Estadistica valor={estadisticas.sistemasEvaluados} label="Sistemas evaluados" />
              <Estadistica valor={estadisticas.paises} label="Países" />
              <Estadistica valor={estadisticas.sectores} label="Sectores" />
              <Estadistica valor={estadisticas.indicadoresItad} label="Indicadores ITAD" />
              <Estadistica
                compacto
                valor={
                  estadisticas.ultimaActualizacion
                    ? new Date(estadisticas.ultimaActualizacion).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
                label="Última actualización"
              />
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Sistemas destacados</h2>
                <Link href="/explorar" className="text-sm text-teal-500 hover:underline">
                  Ver todos →
                </Link>
              </div>

              {destacados.data.length === 0 ? (
                <p className="text-neutral-500">Todavía no hay sistemas publicados en el catálogo.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {destacados.data.map((sistema) => (
                    <SystemCard key={sistema.id} sistema={sistema} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Columna derecha: ficha de sistema (ejemplo con datos reales) */}
          <aside className="rounded-lg border border-neutral-200 p-5">
            <h2 className="mb-1 text-sm font-semibold text-neutral-900">Ficha de sistema (ejemplo)</h2>
            {fichaEjemplo ? (
              <>
                <p className="mb-4 text-xs text-neutral-500">
                  Vista de ejemplo con datos reales de un sistema ya evaluado.
                </p>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline">{fichaEjemplo.institucion.pais}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {fichaEjemplo.gradoAutomatizacion}
                  </Badge>
                </div>
                <p className="font-semibold text-neutral-900">{fichaEjemplo.nombreOficial}</p>
                <p className="mb-3 text-sm text-neutral-500">{fichaEjemplo.institucion.nombre}</p>

                <div className="mb-4 flex items-center gap-3">
                  <ScoreBadge score={fichaEjemplo.resumen.scoreTotal} />
                  <span className="text-sm text-neutral-500">
                    {fichaEjemplo.resumen.scoreTotal !== null
                      ? `${fichaEjemplo.resumen.scoreTotal}/100 ITAD`
                      : "Evaluación incompleta"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {fichaEjemplo.dimensiones.map((d) => (
                    <MiniDimensionBar key={d.id} id={d.id} valorPromedio={d.valorPromedio} />
                  ))}
                </div>

                <Link
                  href={`/sistemas/${fichaEjemplo.id}`}
                  className="mt-4 inline-block text-sm text-teal-500 hover:underline"
                >
                  Ver ficha completa →
                </Link>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                Todavía no hay sistemas publicados para mostrar un ejemplo.
              </p>
            )}
          </aside>
        </div>

        {/* Arquitectura de la plataforma */}
        <section className="border-t border-neutral-200 bg-neutral-50 px-6 py-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-xl font-semibold text-neutral-900">
              Arquitectura de la plataforma
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {ARQUITECTURA.map((paso, i) => (
                <div key={paso} className="flex items-center gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">
                    {paso}
                  </div>
                  {i < ARQUITECTURA.length - 1 && (
                    <span className="text-neutral-400" aria-hidden>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navegación principal */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <h2 className="mb-6 text-xl font-semibold text-neutral-900">Navegación principal</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NAVEGACION.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg border border-neutral-200 p-4 transition-colors hover:border-teal-500"
              >
                <p className="font-semibold text-neutral-900">{item.label}</p>
                <p className="mt-1 text-sm text-neutral-500">{item.descripcion}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Vista de comparación (ejemplo) */}
        <section className="border-y border-neutral-200 bg-neutral-50 px-6 py-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-1 text-xl font-semibold text-neutral-900">
              Vista de comparación (ejemplo)
            </h2>
            {detallesEjemplo.length >= 2 ? (
              <>
                <p className="mb-6 text-sm text-neutral-500">
                  Datos reales de dos sistemas ya evaluados — así se ve el comparador completo.
                </p>
                <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sistema</TableHead>
                        <TableHead>País</TableHead>
                        <TableHead>Puntaje ITAD</TableHead>
                        {dimensionesBase.map((d) => (
                          <TableHead key={d.id} title={d.nombre}>
                            {d.id}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detallesEjemplo.map((sistema) => (
                        <TableRow key={sistema.id}>
                          <TableCell className="font-medium text-neutral-900">
                            {sistema.nombreOficial}
                          </TableCell>
                          <TableCell>{sistema.institucion.pais}</TableCell>
                          <TableCell>
                            <ScoreBadge score={sistema.resumen.scoreTotal} />
                          </TableCell>
                          {sistema.dimensiones.map((d) => (
                            <TableCell key={d.id}>
                              {d.valorPromedio !== null ? d.valorPromedio.toFixed(1) : "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Link
                  href={`/comparar?ids=${detallesEjemplo.map((s) => s.id).join(",")}`}
                  className="mt-4 inline-block text-sm text-teal-500 hover:underline"
                >
                  Abrir en el comparador →
                </Link>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                Hacen falta al menos 2 sistemas publicados para mostrar un ejemplo de comparación.
              </p>
            )}
          </div>
        </section>

        {/* Principios y transparencia */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Principios que guían OITA</h2>
            <ul className="flex flex-col gap-2 text-sm text-neutral-500">
              {PRINCIPIOS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="text-success-500" aria-hidden>
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Transparencia en cada paso</h2>
            <ul className="flex flex-col gap-2 text-sm text-neutral-500">
              {TRANSPARENCIA_PASOS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="text-success-500" aria-hidden>
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

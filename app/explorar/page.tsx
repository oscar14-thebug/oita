import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { SystemCard } from "@/components/system-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  listSistemas,
  obtenerEstadisticasCatalogo,
  obtenerOpcionesFiltro,
} from "@/lib/sistemas/queries";

interface ExplorarProps {
  searchParams: Promise<{
    pais?: string | string[];
    sector?: string | string[];
    institucionId?: string | string[];
    texto?: string | string[];
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

export default async function ExplorarPage({ searchParams }: ExplorarProps) {
  const raw = await searchParams;
  const filtros = {
    pais: primero(raw.pais),
    sector: primero(raw.sector),
    institucionId: primero(raw.institucionId),
    texto: primero(raw.texto),
  };

  const [resultado, estadisticas, opciones] = await Promise.all([
    listSistemas({
      pais: filtros.pais || undefined,
      sector: filtros.sector || undefined,
      institucionId: filtros.institucionId || undefined,
      texto: filtros.texto || undefined,
      limit: 12,
    }),
    obtenerEstadisticasCatalogo(),
    obtenerOpcionesFiltro(),
  ]);

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
              defaultValue={filtros.texto}
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

        {/* Filtros */}
        <section className="mx-auto max-w-6xl px-6 py-8">
          <form action="/explorar" className="flex flex-wrap items-center gap-3">
            <select
              name="pais"
              defaultValue={filtros.pais}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">País</option>
              {opciones.paises.map((pais) => (
                <option key={pais} value={pais}>
                  {pais}
                </option>
              ))}
            </select>

            <select
              name="sector"
              defaultValue={filtros.sector}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Sector</option>
              {opciones.sectores.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>

            <select
              name="institucionId"
              defaultValue={filtros.institucionId}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Institución</option>
              {opciones.instituciones.map((institucion) => (
                <option key={institucion.id} value={institucion.id}>
                  {institucion.nombre}
                </option>
              ))}
            </select>

            <Input
              type="text"
              name="texto"
              defaultValue={filtros.texto}
              placeholder="Palabra clave..."
              className="max-w-[200px]"
            />

            <Button type="submit">Filtrar</Button>
          </form>
        </section>

        {/* Estadísticas */}
        <section className="mx-auto grid max-w-6xl grid-cols-2 gap-6 border-y border-neutral-200 px-6 py-8 sm:grid-cols-4">
          <Estadistica valor={estadisticas.sistemasEvaluados} label="Sistemas evaluados" />
          <Estadistica valor={estadisticas.paises} label="Países" />
          <Estadistica valor={estadisticas.sectores} label="Sectores" />
          <Estadistica valor={estadisticas.indicadoresItad} label="Indicadores ITAD" />
        </section>

        {/* Sistemas */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-6 text-xl font-semibold text-neutral-900">
            {filtros.pais || filtros.sector || filtros.institucionId || filtros.texto
              ? "Resultados"
              : "Todos los sistemas"}
          </h2>

          {resultado.data.length === 0 ? (
            <p className="text-neutral-500">
              {filtros.pais || filtros.sector || filtros.institucionId || filtros.texto
                ? "No hay sistemas publicados que coincidan con estos filtros."
                : "Todavía no hay sistemas publicados en el catálogo."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resultado.data.map((sistema) => (
                <SystemCard key={sistema.id} sistema={sistema} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

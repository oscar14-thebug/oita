import { NavBar } from "@/components/nav-bar";
import { getScoreBand } from "@/lib/ui/getScoreBand";

// Placeholder: pesos y nombres de dimensión confirmados, pero las rúbricas 0-3 de
// cada uno de los 24 indicadores todavía no llegaron de la metodología ITAD 0.9
// real (ver CLAUDE.md → "Contenido placeholder pendiente de reemplazo real").
// Reemplazar esta página cuando ese texto esté disponible.
const DIMENSIONES = [
  { id: "D1", nombre: "Identificación y finalidad", peso: 15 },
  { id: "D2", nombre: "Base jurídica y responsabilidad", peso: 15 },
  { id: "D3", nombre: "Datos y privacidad", peso: 20 },
  { id: "D4", nombre: "Explicabilidad y documentación técnica", peso: 15 },
  { id: "D5", nombre: "Supervisión, derechos y reclamación", peso: 20 },
  { id: "D6", nombre: "Auditoría, desempeño y rendición de cuentas", peso: 15 },
];

const BANDAS = [0, 30, 60, 82, 95].map((score) => ({ score, ...getScoreBand(score) }));

const BAND_DOT_CLASSES = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
} as const;

export default function MetodologiaPage() {
  return (
    <>
      <NavBar />

      <main className="flex-1">
        <section className="bg-navy-900 px-6 py-16 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-balance">Metodología ITAD</h1>
            <p className="mt-4 text-lg text-neutral-200">
              El Índice de Transparencia Algorítmica (ITAD) evalúa cada sistema con 24
              indicadores, agrupados en 6 dimensiones, cada una con un peso relativo sobre el
              score total de 0 a 100.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Dimensiones y pesos</h2>
          <p className="mb-6 text-neutral-500">
            Cada indicador se puntúa de 0 a 3 (o se marca como no aplicable, con
            justificación). El peso de cada dimensión es la suma de los pesos internos de sus
            indicadores.
          </p>
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {DIMENSIONES.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-900">
                  <span className="mr-2 text-xs text-neutral-500">{d.id}</span>
                  {d.nombre}
                </span>
                <span className="text-sm text-neutral-500">{d.peso}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50 px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Fórmula del score</h2>
            <p className="rounded-lg border border-neutral-200 bg-white p-6 text-center font-mono text-sm text-neutral-900">
              score = 100 × Σ(peso_indicador × valor_final / 3) / Σ(peso_indicador aplicable)
            </p>
            <p className="mt-4 text-neutral-500">
              El <code className="text-neutral-900">valor_final</code> de cada indicador es el
              que queda después del control de calidad (doble evaluación, y adjudicación de un
              tercer revisor si la discrepancia es de 2 puntos o más) — nunca la puntuación
              individual de un solo evaluador. Los indicadores marcados como no aplicables se
              excluyen tanto del numerador como del denominador: no cuentan a favor ni en contra.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="mb-6 text-xl font-semibold text-neutral-900">Cómo leer el score</h2>
          <div className="flex flex-col gap-3">
            {BANDAS.map((banda) => (
              <div key={banda.nivel} className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${BAND_DOT_CLASSES[banda.color]}`}
                  aria-hidden
                />
                <span className="text-neutral-900 capitalize">Transparencia {banda.nivel}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-neutral-500">
            Para el proceso completo de curaduría (identificación, evidencia documental, doble
            evaluación, control de calidad y publicación), ver{" "}
            <a href="/sobre-oita" className="text-teal-500 hover:underline">
              Sobre OITA
            </a>
            .
          </p>
        </section>

        <footer className="border-t border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
          <p className="mx-auto max-w-2xl text-sm text-neutral-500">
            OITA no certifica ni aprueba sistemas. Evalúa la transparencia algorítmica con base en
            información pública disponible, no la calidad, legalidad ni el impacto del sistema en
            sí.
          </p>
        </footer>
      </main>
    </>
  );
}

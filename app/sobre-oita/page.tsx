import { NavBar } from "@/components/nav-bar";
import { getScoreBand } from "@/lib/ui/getScoreBand";

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

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
        {numero}
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900">{titulo}</h3>
        <p className="mt-1 text-neutral-500">{children}</p>
      </div>
    </div>
  );
}

export default function SobreOitaPage() {
  return (
    <>
      <NavBar />

      <main className="flex-1">
        <section className="bg-navy-900 px-6 py-16 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-balance">Sobre OITA</h1>
            <p className="mt-4 text-lg text-neutral-200">
              El Observatorio Interamericano de Transparencia Algorítmica documenta y evalúa
              públicamente los sistemas de decisión automatizada que usan instituciones públicas
              de América Latina, con base en la metodología ITAD (Índice de Transparencia
              Algorítmica).
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Qué hacemos</h2>
          <p className="text-neutral-500">
            Cuando una entidad pública usa un algoritmo para decidir o recomendar algo que afecta
            a personas — desde seleccionar becarios hasta clasificar hogares para programas
            sociales — la ciudadanía tiene derecho a saber que existe, cómo funciona y qué tan
            documentado está. OITA construye una ficha pública por cada sistema evaluado: su
            finalidad, la institución responsable, el grado de automatización y, sobre todo, qué
            tan transparente es según evidencia documental verificable.
          </p>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50 px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-semibold text-neutral-900">
              Curaduría humana, no descubrimiento automático
            </h2>
            <p className="mb-6 text-neutral-500">
              OITA es un sistema de curaduría <strong className="text-neutral-900">humana</strong>.
              La plataforma no rastrea la web ni decide puntuaciones por su cuenta — solo agrega y
              calcula lo que un equipo de analistas carga y evalúa manualmente. Cada ficha sigue
              este proceso:
            </p>
            <div className="flex flex-col gap-6">
              <Paso numero={1} titulo="Identificación y elegibilidad">
                Un analista identifica un sistema algorítmico público y verifica que cumpla los
                criterios de elegibilidad (actor público, componente algorítmico, sistema
                operativo, incidencia pública, ámbito geográfico) antes de avanzar.
              </Paso>
              <Paso numero={2} titulo="Evidencia documental">
                Se registran fuentes públicas (normativa, portales de datos abiertos, informes,
                noticias) que sustentan cada puntuación, clasificadas por nivel de confiabilidad
                (A a D).
              </Paso>
              <Paso numero={3} titulo="Doble evaluación">
                Dos evaluadores puntúan, de forma independiente, cada uno de los 24 indicadores en
                una escala de 0 a 3 (o lo marcan como no aplicable, con justificación).
              </Paso>
              <Paso numero={4} titulo="Control de calidad">
                Cuando ambas puntuaciones difieren, se adjudica un valor final; si la discrepancia
                es de 2 puntos o más, interviene un tercer revisor. Ese valor final —no la
                puntuación individual— es el que se publica.
              </Paso>
              <Paso numero={5} titulo="Publicación">
                Solo un editor o administrador puede publicar una ficha en el catálogo. Hasta
                entonces, es un borrador visible solo para el equipo.
              </Paso>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">La metodología ITAD</h2>
          <p className="mb-6 text-neutral-500">
            24 indicadores agrupados en 6 dimensiones, cada una con un peso relativo sobre el
            score total de 0 a 100:
          </p>
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {DIMENSIONES.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-900">{d.nombre}</span>
                <span className="text-sm text-neutral-500">{d.peso}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-neutral-500">
            Los indicadores marcados como no aplicables se excluyen tanto del puntaje como del
            peso total considerado — no cuentan a favor ni en contra.
          </p>
        </section>

        <section className="border-t border-neutral-200 bg-neutral-50 px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-semibold text-neutral-900">
              Cómo leer el score
            </h2>
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
              Un sistema en la vista de{" "}
              <a href="/panorama-regional" className="text-teal-500 hover:underline">
                Panorama regional
              </a>{" "}
              puede ordenarse por score, pero siempre junto con filtros y contexto — nunca lo
              presentamos como un ranking aislado de &quot;mejores algoritmos&quot;.
            </p>
          </div>
        </section>

        <footer className="border-t border-neutral-200 px-6 py-8 text-center">
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

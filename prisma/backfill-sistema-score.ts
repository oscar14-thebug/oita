import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { recalcularYGuardarScore } from "@/lib/scoring/calcularScoreITAD";

/**
 * Backfill de `sistema_score` para sistemas que ya tienen puntuaciones cargadas
 * pero nunca dispararon un recálculo (p.ej. porque fueron cargados antes de que
 * `crearPuntuacion`/`resolverControlCalidad` empezaran a llamar
 * `recalcularYGuardarScore`, o porque el único recálculo disponible dependía de
 * una adjudicación de control de calidad que nunca llegó a ocurrir).
 *
 * Usa la MISMA función que usa la app (`recalcularYGuardarScore` /
 * `calcularScoreITAD`) — no reimplementa la fórmula — así que respeta pesos por
 * indicador/dimensión y excluye `es_no_aplicable` exactamente igual que el resto
 * de la plataforma. Sistemas sin ningún indicador resuelto todavía (p.ej. con
 * discrepancias de doble evaluación pendientes de adjudicar) quedan `sin_evaluar`
 * y no se les escribe fila, igual que haría la app.
 *
 * Uso: tsx prisma/backfill-sistema-score.ts
 */
async function main() {
  const sistemas = await prisma.sistema.findMany({
    where: { score: null },
    select: { id: true, nombreOficial: true },
    orderBy: { nombreOficial: "asc" },
  });

  console.log(`${sistemas.length} sistema(s) sin fila en sistema_score. Recalculando...`);

  let actualizados = 0;
  let pendientes = 0;

  for (const sistema of sistemas) {
    const score = await recalcularYGuardarScore(sistema.id);

    if (score.estado === "evaluado") {
      actualizados += 1;
      console.log(`  [OK]       ${sistema.nombreOficial} -> score_total = ${score.scoreTotal}`);
    } else {
      pendientes += 1;
      console.log(
        `  [PENDIENTE] ${sistema.nombreOficial} -> sin indicadores resueltos todavía ` +
          `(sin puntuaciones, o con discrepancias de doble evaluación sin adjudicar)`,
      );
    }
  }

  console.log(`\nListo: ${actualizados} sistema(s) actualizados, ${pendientes} siguen pendientes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

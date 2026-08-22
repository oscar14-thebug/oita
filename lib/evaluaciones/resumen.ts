import { prisma } from "@/lib/prisma";
import { calcularScoreITAD } from "@/lib/scoring/calcularScoreITAD";

export interface ResumenSistema {
  estado: "evaluado" | "sin_evaluar";
  scoreTotal: number | null;
  coberturaDocumental: number | null;
  distribucion: { "0": number; "1": number; "2": number; "3": number; na: number };
  puntuacionPorDimension: Record<string, number> | null;
  fuente: "cache" | "calculado";
  actualizadoEn: string | null;
}

/**
 * Devuelve el resumen de un sistema. Si existe una fila en `sistema_score` la usa
 * (evita recalcular); si no, delega en `calcularScoreITAD` (SCRUM-12) — suficiente
 * para el catálogo chico del MVP (ver notas de diseño de OITA_Esquema_BD_v1.md).
 */
export async function calcularResumenSistema(sistemaId: string): Promise<ResumenSistema> {
  const cache = await prisma.sistemaScore.findUnique({ where: { sistemaId } });

  if (cache) {
    return {
      estado: "evaluado",
      scoreTotal: Number(cache.scoreTotal),
      coberturaDocumental: Number(cache.coberturaDocumental),
      distribucion: {
        "0": cache.distribucion0,
        "1": cache.distribucion1,
        "2": cache.distribucion2,
        "3": cache.distribucion3,
        na: cache.distribucionNa,
      },
      puntuacionPorDimension: cache.puntuacionPorDimension as Record<string, number>,
      fuente: "cache",
      actualizadoEn: cache.actualizadoEn.toISOString(),
    };
  }

  const score = await calcularScoreITAD(sistemaId);

  return {
    estado: score.estado,
    scoreTotal: score.scoreTotal,
    coberturaDocumental: score.coberturaDocumental,
    distribucion: score.distribucion,
    puntuacionPorDimension: score.scorePorDimension,
    fuente: "calculado",
    actualizadoEn: null,
  };
}

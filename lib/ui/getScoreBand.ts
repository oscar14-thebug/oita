export type ScoreBandColor = "success" | "warning" | "danger";

export interface ScoreBand {
  nivel: string;
  color: ScoreBandColor;
}

/**
 * Banda de transparencia según el score ITAD (0-100), usada en cualquier
 * componente que muestre un score (SystemCard, ficha individual, comparador, panorama regional).
 * Ver OITA_Diseno_a_Codigo.md — estas bandas son la regla de negocio de interpretación
 * del score, ya usada en el diseño de Figma.
 */
export function getScoreBand(score: number): ScoreBand {
  if (score >= 90) return { nivel: "muy alta", color: "success" };
  if (score >= 75) return { nivel: "alta", color: "success" };
  if (score >= 50) return { nivel: "intermedia", color: "warning" };
  if (score >= 25) return { nivel: "baja", color: "danger" };
  return { nivel: "muy baja", color: "danger" };
}

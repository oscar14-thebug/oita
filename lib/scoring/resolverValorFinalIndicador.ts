export type EstadoResolucionIndicador =
  | "adjudicado"
  | "individual"
  | "pendiente_adjudicacion"
  | "sin_evaluar";

export interface ResolucionIndicador {
  estado: EstadoResolucionIndicador;
  valor: number | null;
}

/**
 * Resuelve el valor final de UN indicador a partir de sus puntuaciones (de un
 * sistema ya filtradas a ese indicador, sin las marcadas N/A) y, si existe, su
 * fila adjudicada en `control_calidad`. Única fuente de verdad para esta regla:
 * la usan tanto el cálculo de score (`calcularScoreITAD`) como la ficha pública
 * (`getSistemaDetalle` / `IndicadoresTable`), para que ambos coincidan siempre.
 *
 *   - "adjudicado": hay `control_calidad` con `valorFinal` (doble evaluación
 *     resuelta) — se usa ese valor.
 *   - "individual": no hay `control_calidad` pero sí exactamente una puntuación
 *     (un solo evaluador, sin discrepancia posible) — se usa su valor directo.
 *   - "pendiente_adjudicacion": 2+ puntuaciones sin `control_calidad` todavía —
 *     hay una discrepancia potencial sin resolver.
 *   - "sin_evaluar": ninguna puntuación cargada para este indicador.
 */
export function resolverValorFinalIndicador(
  puntuaciones: { valor: number | null }[],
  control: { valorFinal: number } | undefined,
): ResolucionIndicador {
  if (control) {
    return { estado: "adjudicado", valor: control.valorFinal };
  }
  if (puntuaciones.length === 1 && puntuaciones[0].valor !== null) {
    return { estado: "individual", valor: puntuaciones[0].valor };
  }
  if (puntuaciones.length >= 2) {
    return { estado: "pendiente_adjudicacion", valor: null };
  }
  return { estado: "sin_evaluar", valor: null };
}

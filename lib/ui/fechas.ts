/**
 * Formatea un timestamp real (p.ej. fecha_ultima_revision, @db.Timestamptz) en la
 * zona horaria local del navegador — acá sí importa "cuándo" pasó de verdad.
 */
export function formatearFechaHora(valor: string | Date): string {
  return new Date(valor).toLocaleDateString("es", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea una fecha "de calendario" (p.ej. fecha_consulta, fecha_publicacion,
 * @db.Date — sin hora) forzando UTC. Estos valores se guardan como medianoche UTC
 * del día elegido; si se formatean en la zona horaria local del navegador (más
 * atrasada que UTC), se corre un día para atrás. Por eso siempre timeZone: "UTC" acá.
 */
export function formatearFechaCalendario(valor: string | Date): string {
  return new Date(valor).toLocaleDateString("es", { timeZone: "UTC" });
}

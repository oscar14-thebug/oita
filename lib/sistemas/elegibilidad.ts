/**
 * PLACEHOLDER — "los 5 criterios de la puerta de entrada" de la metodología ITAD 0.9
 * todavía no fueron compartidos (no están en OITA_Esquema_BD_v1.md ni en el resto de
 * la documentación disponible). Estos 5 criterios son genéricos, inspirados en marcos
 * usuales de rendición de cuentas algorítmica, y deben reemplazarse por el texto real
 * del documento metodológico apenas esté disponible — solo se usan acá y en
 * lib/sistemas/reglas.ts, así que el reemplazo es un cambio de un solo lugar.
 */
export const CRITERIOS_ELEGIBILIDAD = [
  {
    id: "automatizacion",
    titulo: "Automatización relevante",
    pregunta:
      "¿El sistema usa reglas automatizadas, estadísticas o de aprendizaje automático para " +
      "tomar o apoyar una decisión (no es solo un formulario o una base de datos simple)?",
  },
  {
    id: "institucion_publica",
    titulo: "Uso por una institución pública",
    pregunta:
      "¿Es operado, contratado o encargado por una institución del Estado (no es un sistema " +
      "puramente privado sin relación con lo público)?",
  },
  {
    id: "impacto_personas",
    titulo: "Impacto sobre personas",
    pregunta:
      "¿Sus resultados afectan directa o indirectamente derechos, accesos, beneficios u " +
      "obligaciones de personas concretas?",
  },
  {
    id: "uso_operativo",
    titulo: "Uso operativo (no piloto aislado)",
    pregunta:
      "¿Está en uso operativo (piloto, prueba o producción), y no es solo un experimento de " +
      "investigación sin aplicación real?",
  },
  {
    id: "informacion_minima",
    titulo: "Información mínima disponible",
    pregunta:
      "¿Existe algún nivel de información pública o accesible sobre el sistema que permita " +
      "iniciar una evaluación (no es completamente opaco o clasificado)?",
  },
] as const;

export type CriterioElegibilidadId = (typeof CRITERIOS_ELEGIBILIDAD)[number]["id"];

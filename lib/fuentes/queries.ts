import { prisma } from "@/lib/prisma";

export interface FuenteResumen {
  id: string;
  titulo: string;
  urlOIdentificador: string;
  nivel: string;
  fechaConsulta: string;
}

/**
 * Agrupa, por indicador, las fuentes que sustentan las puntuaciones de un sistema
 * (dedupeadas). Recorre `puntuaciones` de cada evaluador vía `fuentes_puntuaciones`,
 * ya que la trazabilidad a la fuente vive ahí, no en `control_calidad`.
 */
export async function agruparFuentesPorIndicador(
  sistemaId: string,
): Promise<Map<string, FuenteResumen[]>> {
  const puntuaciones = await prisma.puntuacion.findMany({
    where: { sistemaId },
    include: { fuentesPuntuaciones: { include: { fuente: true } } },
  });

  const porIndicador = new Map<string, FuenteResumen[]>();

  for (const puntuacion of puntuaciones) {
    const existentes = porIndicador.get(puntuacion.indicadorId) ?? [];
    for (const { fuente } of puntuacion.fuentesPuntuaciones) {
      if (!existentes.some((f) => f.id === fuente.id)) {
        existentes.push({
          id: fuente.id,
          titulo: fuente.titulo,
          urlOIdentificador: fuente.urlOIdentificador,
          nivel: fuente.nivel,
          fechaConsulta: fuente.fechaConsulta.toISOString(),
        });
      }
    }
    porIndicador.set(puntuacion.indicadorId, existentes);
  }

  return porIndicador;
}

/** Lista las fuentes registradas para un sistema, más recientes primero. */
export async function listarFuentesPorSistema(sistemaId: string) {
  return prisma.fuente.findMany({
    where: { sistemaId },
    orderBy: { fechaConsulta: "desc" },
  });
}

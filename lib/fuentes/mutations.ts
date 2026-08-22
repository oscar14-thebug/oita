import { prisma } from "@/lib/prisma";
import { validarNivel, validarFechaConsulta } from "./reglas";

export interface CrearFuenteInput {
  sistemaId: string;
  urlOIdentificador: string;
  titulo: string;
  entidadEmisora: string;
  fechaPublicacion?: string | null;
  fechaConsulta: string;
  nivel: string;
  fragmento: string;
  versionSistemaReferida?: string | null;
  notas?: string | null;
  analistaId: string;
}

export async function crearFuente(input: CrearFuenteInput) {
  validarNivel(input.nivel);

  const fechaConsulta = new Date(input.fechaConsulta);
  validarFechaConsulta(fechaConsulta);

  return prisma.fuente.create({
    data: {
      sistemaId: input.sistemaId,
      urlOIdentificador: input.urlOIdentificador,
      titulo: input.titulo,
      entidadEmisora: input.entidadEmisora,
      fechaPublicacion: input.fechaPublicacion ? new Date(input.fechaPublicacion) : null,
      fechaConsulta,
      nivel: input.nivel,
      fragmento: input.fragmento,
      versionSistemaReferida: input.versionSistemaReferida ?? null,
      notas: input.notas ?? null,
      analistaId: input.analistaId,
    },
  });
}

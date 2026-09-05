import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { agruparFuentesPorIndicador, type FuenteResumen } from "@/lib/fuentes/queries";
import { calcularResumenSistema } from "@/lib/evaluaciones/resumen";
import { getScoreBand } from "@/lib/ui/getScoreBand";

const LIMIT_DEFAULT = 20;
const LIMIT_MAXIMO = 100;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ListSistemasParams {
  pais?: string;
  sector?: string;
  institucionId?: string;
  texto?: string;
  limit?: number;
  offset?: number;
}

export interface SistemaListItem {
  id: string;
  nombreOficial: string;
  estado: string;
  institucion: { nombre: string; pais: string };
  scoreTotal: number | null;
  perfil: {
    finalidad: string;
    proceso: string;
    gradoAutomatizacion: string;
  };
}

export interface ListSistemasResultado {
  data: SistemaListItem[];
  total: number;
  limit: number;
  offset: number;
}

function normalizarLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit) || limit <= 0) return LIMIT_DEFAULT;
  return Math.min(limit, LIMIT_MAXIMO);
}

function normalizarOffset(offset?: number): number {
  if (!offset || Number.isNaN(offset) || offset < 0) return 0;
  return offset;
}

function construirWhere(params: ListSistemasParams): Prisma.SistemaWhereInput {
  // El catálogo público solo muestra fichas publicadas (SCRUM-16: publicar/despublicar
  // es una acción de admin/editor sobre `Sistema.publicado`).
  const where: Prisma.SistemaWhereInput = { publicado: true };

  if (params.institucionId) {
    // institucionId es uuid en la base: un valor con formato inválido nunca puede
    // matchear, así que se fuerza a un uuid válido pero imposible en vez de dejar
    // que Postgres rechace la consulta con un error de tipo.
    where.institucionId = UUID_REGEX.test(params.institucionId)
      ? params.institucionId
      : "00000000-0000-0000-0000-000000000000";
  }

  if (params.texto) {
    where.nombreOficial = { contains: params.texto, mode: "insensitive" };
  }

  if (params.pais || params.sector) {
    where.institucion = {
      ...(params.pais ? { pais: params.pais } : {}),
      ...(params.sector ? { sector: params.sector } : {}),
    };
  }

  return where;
}

/** Lista sistemas con filtros opcionales (pais, sector, institucionId, texto) y paginación. */
export async function listSistemas(params: ListSistemasParams): Promise<ListSistemasResultado> {
  const limit = normalizarLimit(params.limit);
  const offset = normalizarOffset(params.offset);
  const where = construirWhere(params);

  const [total, sistemas] = await Promise.all([
    prisma.sistema.count({ where }),
    prisma.sistema.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { nombreOficial: "asc" },
      include: {
        institucion: { select: { nombre: true, pais: true } },
        score: { select: { scoreTotal: true } },
      },
    }),
  ]);

  const data: SistemaListItem[] = sistemas.map((sistema) => ({
    id: sistema.id,
    nombreOficial: sistema.nombreOficial,
    estado: sistema.estado,
    institucion: { nombre: sistema.institucion.nombre, pais: sistema.institucion.pais },
    scoreTotal: sistema.score ? Number(sistema.score.scoreTotal) : null,
    perfil: {
      finalidad: sistema.finalidad,
      proceso: sistema.proceso,
      gradoAutomatizacion: sistema.gradoAutomatizacion,
    },
  }));

  return { data, total, limit, offset };
}

export interface EstadisticasCatalogo {
  sistemasEvaluados: number;
  paises: number;
  sectores: number;
  indicadoresItad: number;
  ultimaActualizacion: string | null;
}

/** Estadísticas reales del catálogo público, para la fila de stats del Home. */
export async function obtenerEstadisticasCatalogo(): Promise<EstadisticasCatalogo> {
  const [sistemasEvaluados, institucionesConPublicado, indicadoresItad, ultimaRevision] =
    await Promise.all([
      prisma.sistema.count({ where: { publicado: true } }),
      prisma.institucion.findMany({
        where: { sistemas: { some: { publicado: true } } },
        select: { pais: true, sector: true },
      }),
      prisma.indicador.count({ where: { activo: true } }),
      prisma.sistema.aggregate({
        where: { publicado: true },
        _max: { fechaUltimaRevision: true },
      }),
    ]);

  return {
    sistemasEvaluados,
    paises: new Set(institucionesConPublicado.map((i) => i.pais)).size,
    sectores: new Set(institucionesConPublicado.map((i) => i.sector)).size,
    indicadoresItad,
    ultimaActualizacion: ultimaRevision._max.fechaUltimaRevision?.toISOString() ?? null,
  };
}

export interface OpcionesFiltroCatalogo {
  paises: string[];
  sectores: string[];
  instituciones: { id: string; nombre: string }[];
}

/** Opciones reales para los dropdowns de filtro (solo entre instituciones con al menos un sistema publicado). */
export async function obtenerOpcionesFiltro(): Promise<OpcionesFiltroCatalogo> {
  const instituciones = await prisma.institucion.findMany({
    where: { sistemas: { some: { publicado: true } } },
    select: { id: true, nombre: true, pais: true, sector: true },
    orderBy: { nombre: "asc" },
  });

  return {
    paises: Array.from(new Set(instituciones.map((i) => i.pais))).sort(),
    sectores: Array.from(new Set(instituciones.map((i) => i.sector))).sort(),
    instituciones: instituciones.map((i) => ({ id: i.id, nombre: i.nombre })),
  };
}

export interface DimensionOpcion {
  id: string;
  nombre: string;
}

/** Las 6 dimensiones (id + nombre), para dropdowns de filtro. */
export async function obtenerDimensiones(): Promise<DimensionOpcion[]> {
  const dimensiones = await prisma.dimension.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });
  return dimensiones;
}

export interface FilaPanorama {
  id: string;
  nombreOficial: string;
  institucion: { nombre: string; pais: string; sector: string };
  /** 0-100. Si hay dimensionId en el filtro, es el valor de esa dimensión escalado a 100; si no, scoreTotal. */
  score: number | null;
}

export interface PanoramaRegionalResultado {
  filas: FilaPanorama[];
  promedioScore: number | null;
  distribucionBandas: { alta: number; intermedia: number; baja: number; sinEvaluar: number };
  promedioPorPais: { pais: string; promedio: number }[];
}

export interface PanoramaRegionalParams {
  pais?: string;
  sector?: string;
  dimensionId?: string;
  orden?: "asc" | "desc";
}

/**
 * Vista agregada del catálogo público: promedios, distribución por banda de
 * transparencia y promedio por país — para /panorama-regional (SCRUM-20).
 *
 * Ojo: esto es explícitamente NO un ranking de "mejores algoritmos" (confirmado
 * por el equipo metodológico el 22-ago-2026) — puede ordenarse por puntuación,
 * pero siempre junto con filtros/contexto, nunca como leaderboard aislado. Por
 * eso el nombre "panorama", no "ranking", en toda la interfaz pública.
 */
export async function obtenerPanoramaRegional(
  params: PanoramaRegionalParams,
): Promise<PanoramaRegionalResultado> {
  const where: Prisma.SistemaWhereInput = { publicado: true };
  if (params.pais || params.sector) {
    where.institucion = {
      ...(params.pais ? { pais: params.pais } : {}),
      ...(params.sector ? { sector: params.sector } : {}),
    };
  }

  const sistemas = await prisma.sistema.findMany({
    where,
    include: { institucion: { select: { nombre: true, pais: true, sector: true } } },
  });

  const resumenes = await Promise.all(sistemas.map((s) => calcularResumenSistema(s.id)));

  const filas: FilaPanorama[] = sistemas.map((sistema, i) => {
    const resumen = resumenes[i];
    let score: number | null;

    if (params.dimensionId) {
      const valorDimension = resumen.puntuacionPorDimension?.[params.dimensionId] ?? null;
      score = valorDimension !== null ? Number(((valorDimension / 3) * 100).toFixed(2)) : null;
    } else {
      score = resumen.scoreTotal;
    }

    return {
      id: sistema.id,
      nombreOficial: sistema.nombreOficial,
      institucion: sistema.institucion,
      score,
    };
  });

  filas.sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return params.orden === "asc" ? a.score - b.score : b.score - a.score;
  });

  const puntuadas = filas.filter((f): f is FilaPanorama & { score: number } => f.score !== null);
  const promedioScore =
    puntuadas.length > 0
      ? Number((puntuadas.reduce((suma, f) => suma + f.score, 0) / puntuadas.length).toFixed(2))
      : null;

  const distribucionBandas = { alta: 0, intermedia: 0, baja: 0, sinEvaluar: 0 };
  for (const fila of filas) {
    if (fila.score === null) {
      distribucionBandas.sinEvaluar += 1;
      continue;
    }
    const banda = getScoreBand(fila.score).nivel;
    if (banda === "muy alta" || banda === "alta") distribucionBandas.alta += 1;
    else if (banda === "intermedia") distribucionBandas.intermedia += 1;
    else distribucionBandas.baja += 1;
  }

  const porPais = new Map<string, number[]>();
  for (const fila of puntuadas) {
    const lista = porPais.get(fila.institucion.pais) ?? [];
    lista.push(fila.score);
    porPais.set(fila.institucion.pais, lista);
  }
  const promedioPorPais = Array.from(porPais.entries())
    .map(([pais, valores]) => ({
      pais,
      promedio: Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)),
    }))
    .sort((a, b) => b.promedio - a.promedio);

  return { filas, promedioScore, distribucionBandas, promedioPorPais };
}

export interface PuntuacionFicha {
  indicadorId: string;
  indicador: string;
  preguntaEvaluativa: string;
  dimensionId: string;
  dimension: string;
  /** null si el indicador todavía no tiene un valor final adjudicado (control_calidad). */
  valorFinal: number | null;
  esNoAplicable: boolean;
  decisionAdjudicacion: string | null;
  fuentes: FuenteResumen[];
}

export interface DimensionFicha {
  id: string;
  nombre: string;
  peso: number;
  /** Promedio 0-3 de los indicadores aplicables de esta dimensión; null si ninguno fue evaluado. */
  valorPromedio: number | null;
}

/**
 * Ficha completa de un sistema: identificación, institución, indicadores y resumen.
 *
 * Por default solo devuelve fichas publicadas (catálogo público). Pasar
 * `incluirBorrador: true` permite ver un sistema en borrador también — quien llama
 * es responsable de solo activarlo cuando el usuario actual sea admin/editor (ver
 * lib/auth/sesion.ts → puedeVerBorradores).
 */
export async function getSistemaDetalle(id: string, opciones?: { incluirBorrador?: boolean }) {
  // sistemas.id es uuid en la base: un id con formato inválido nunca puede existir,
  // así que se corta acá para devolver 404 en vez de que Postgres rechace la consulta.
  if (!UUID_REGEX.test(id)) return null;

  // findFirst (no findUnique) porque se combina el id con el filtro publicado — el
  // catálogo público no expone fichas en borrador, salvo que se pida explícitamente.
  const sistema = await prisma.sistema.findFirst({
    where: { id, ...(opciones?.incluirBorrador ? {} : { publicado: true }) },
    include: {
      institucion: true,
      versionMetodologia: true,
    },
  });

  if (!sistema) return null;

  const [dimensiones, indicadores, controlCalidad, puntuacionesNa, fuentesPorIndicador, resumen] =
    await Promise.all([
      prisma.dimension.findMany({ orderBy: { orden: "asc" } }),
      prisma.indicador.findMany({
        where: { activo: true },
        include: { dimension: true },
        orderBy: [{ dimension: { orden: "asc" } }, { id: "asc" }],
      }),
      prisma.controlCalidad.findMany({ where: { sistemaId: id } }),
      prisma.puntuacion.findMany({
        where: { sistemaId: id, esNoAplicable: true },
        select: { indicadorId: true },
      }),
      agruparFuentesPorIndicador(id),
      calcularResumenSistema(id),
    ]);

  const controlPorIndicador = new Map(controlCalidad.map((c) => [c.indicadorId, c]));
  const indicadoresNa = new Set(puntuacionesNa.map((p) => p.indicadorId));

  const puntuaciones: PuntuacionFicha[] = indicadores.map((indicador) => {
    const control = controlPorIndicador.get(indicador.id);
    return {
      indicadorId: indicador.id,
      indicador: indicador.nombre,
      preguntaEvaluativa: indicador.preguntaEvaluativa,
      dimensionId: indicador.dimensionId,
      dimension: indicador.dimension.nombre,
      valorFinal: control?.valorFinal ?? null,
      esNoAplicable: indicadoresNa.has(indicador.id),
      decisionAdjudicacion: control?.decisionAdjudicacion ?? null,
      fuentes: fuentesPorIndicador.get(indicador.id) ?? [],
    };
  });

  const dimensionesFicha: DimensionFicha[] = dimensiones.map((dimension) => ({
    id: dimension.id,
    nombre: dimension.nombre,
    peso: dimension.peso,
    valorPromedio: resumen.puntuacionPorDimension?.[dimension.id] ?? null,
  }));

  return {
    id: sistema.id,
    nombreOficial: sistema.nombreOficial,
    versionSistema: sistema.versionSistema,
    estado: sistema.estado,
    finalidad: sistema.finalidad,
    proceso: sistema.proceso,
    usuariosDescripcion: sistema.usuariosDescripcion,
    poblacionAfectada: sistema.poblacionAfectada,
    gradoAutomatizacion: sistema.gradoAutomatizacion,
    elegibilidadJustificacion: sistema.elegibilidadJustificacion,
    fechaCreacion: sistema.fechaCreacion.toISOString(),
    fechaUltimaRevision: sistema.fechaUltimaRevision.toISOString(),
    institucion: sistema.institucion,
    versionMetodologia: sistema.versionMetodologia,
    dimensiones: dimensionesFicha,
    puntuaciones,
    resumen,
  };
}

export interface SistemaBackoffice {
  id: string;
  nombreOficial: string;
  institucion: { nombre: string };
  estado: string;
  publicado: boolean;
}

/** Todos los sistemas (borrador y publicados), para el listado del backoffice. */
export async function listarSistemasBackoffice(): Promise<SistemaBackoffice[]> {
  const sistemas = await prisma.sistema.findMany({
    orderBy: { fechaUltimaRevision: "desc" },
    include: { institucion: { select: { nombre: true } } },
  });

  return sistemas.map((s) => ({
    id: s.id,
    nombreOficial: s.nombreOficial,
    institucion: { nombre: s.institucion.nombre },
    estado: s.estado,
    publicado: s.publicado,
  }));
}

export interface InstitucionOpcion {
  id: string;
  nombre: string;
  pais: string;
  sector: string;
}

/** Todas las instituciones (a diferencia de obtenerOpcionesFiltro, sin filtrar por publicado). */
export async function listarInstitucionesTodas(): Promise<InstitucionOpcion[]> {
  return prisma.institucion.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, pais: true, sector: true },
  });
}

export interface IndicadorEditor {
  id: string;
  nombre: string;
  preguntaEvaluativa: string;
  dimensionId: string;
  dimension: string;
  /** La puntuación que YA registró este evaluador para este indicador, si existe. */
  miPuntuacion: {
    valor: number | null;
    esNoAplicable: boolean;
    justificacionNa: string | null;
    notaJustificativa: string;
    fuenteIds: string[];
  } | null;
}

/**
 * Ficha en modo edición para el backoffice (SCRUM-21): a diferencia de
 * getSistemaDetalle, no filtra por publicado (acá se editan borradores) y trae,
 * por indicador, la puntuación que el evaluador actual ya registró (si la hay),
 * en vez de la puntuación final adjudicada.
 */
export async function obtenerSistemaParaEditar(id: string, evaluadorId: string) {
  if (!UUID_REGEX.test(id)) return null;

  const sistema = await prisma.sistema.findUnique({
    where: { id },
    include: { institucion: true },
  });

  if (!sistema) return null;

  const [indicadores, misPuntuaciones, fuentes] = await Promise.all([
    prisma.indicador.findMany({
      where: { activo: true },
      include: { dimension: true },
      orderBy: [{ dimension: { orden: "asc" } }, { id: "asc" }],
    }),
    prisma.puntuacion.findMany({
      where: { sistemaId: id, evaluadorId },
      include: { fuentesPuntuaciones: true },
    }),
    prisma.fuente.findMany({ where: { sistemaId: id }, orderBy: { fechaConsulta: "desc" } }),
  ]);

  const misPuntuacionesPorIndicador = new Map(misPuntuaciones.map((p) => [p.indicadorId, p]));

  const indicadoresEditor: IndicadorEditor[] = indicadores.map((indicador) => {
    const puntuacion = misPuntuacionesPorIndicador.get(indicador.id);
    return {
      id: indicador.id,
      nombre: indicador.nombre,
      preguntaEvaluativa: indicador.preguntaEvaluativa,
      dimensionId: indicador.dimensionId,
      dimension: indicador.dimension.nombre,
      miPuntuacion: puntuacion
        ? {
            valor: puntuacion.valor,
            esNoAplicable: puntuacion.esNoAplicable,
            justificacionNa: puntuacion.justificacionNa,
            notaJustificativa: puntuacion.notaJustificativa,
            fuenteIds: puntuacion.fuentesPuntuaciones.map((fp) => fp.fuenteId),
          }
        : null,
    };
  });

  return {
    id: sistema.id,
    nombreOficial: sistema.nombreOficial,
    versionSistema: sistema.versionSistema,
    estado: sistema.estado,
    institucionId: sistema.institucionId,
    finalidad: sistema.finalidad,
    proceso: sistema.proceso,
    usuariosDescripcion: sistema.usuariosDescripcion,
    poblacionAfectada: sistema.poblacionAfectada,
    gradoAutomatizacion: sistema.gradoAutomatizacion,
    elegibilidadJustificacion: sistema.elegibilidadJustificacion,
    publicado: sistema.publicado,
    institucion: sistema.institucion,
    indicadores: indicadoresEditor,
    fuentes,
  };
}

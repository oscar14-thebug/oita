-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('analista', 'revisor', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "estado_sistema" AS ENUM ('piloto', 'prueba', 'produccion', 'suspendido', 'retirado');

-- CreateEnum
CREATE TYPE "nivel_fuente" AS ENUM ('A', 'B', 'C', 'D');

-- CreateTable
CREATE TABLE "dimensiones" (
    "id" VARCHAR(10) NOT NULL,
    "nombre" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "dimensiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores" (
    "id" VARCHAR(20) NOT NULL,
    "dimension_id" VARCHAR(10) NOT NULL,
    "nombre" TEXT NOT NULL,
    "pregunta_evaluativa" TEXT NOT NULL,
    "peso_interno" INTEGER NOT NULL,
    "rubrica" JSONB NOT NULL,
    "nota_interpretativa" TEXT,
    "version_metodologia_id" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "indicadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones_metodologia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" VARCHAR(20) NOT NULL,
    "fecha" DATE NOT NULL,
    "changelog" TEXT NOT NULL,
    "fecha_efectiva" DATE NOT NULL,

    CONSTRAINT "versiones_metodologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "pais" VARCHAR(2) NOT NULL,
    "sector" TEXT NOT NULL,
    "unidad_responsable" TEXT,
    "contacto" TEXT,

    CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistemas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_oficial" TEXT NOT NULL,
    "version_sistema" TEXT,
    "estado" "estado_sistema" NOT NULL,
    "institucion_id" UUID NOT NULL,
    "finalidad" TEXT NOT NULL,
    "proceso" TEXT NOT NULL,
    "usuarios_descripcion" TEXT NOT NULL,
    "poblacion_afectada" TEXT,
    "grado_automatizacion" TEXT NOT NULL,
    "elegibilidad_justificacion" JSONB NOT NULL,
    "version_metodologia_id" UUID NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_revision" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sistemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuentes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sistema_id" UUID NOT NULL,
    "url_o_identificador" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "entidad_emisora" TEXT NOT NULL,
    "fecha_publicacion" DATE,
    "fecha_consulta" DATE NOT NULL,
    "nivel" "nivel_fuente" NOT NULL,
    "fragmento" TEXT NOT NULL,
    "version_sistema_referida" TEXT,
    "analista_id" UUID NOT NULL,
    "notas" TEXT,
    "archivo_hash" TEXT,

    CONSTRAINT "fuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntuaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sistema_id" UUID NOT NULL,
    "indicador_id" VARCHAR(20) NOT NULL,
    "valor" SMALLINT,
    "es_no_aplicable" BOOLEAN NOT NULL DEFAULT false,
    "justificacion_na" TEXT,
    "nota_justificativa" TEXT NOT NULL,
    "evaluador_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puntuaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuentes_puntuaciones" (
    "puntuacion_id" UUID NOT NULL,
    "fuente_id" UUID NOT NULL,

    CONSTRAINT "fuentes_puntuaciones_pkey" PRIMARY KEY ("puntuacion_id","fuente_id")
);

-- CreateTable
CREATE TABLE "control_calidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sistema_id" UUID NOT NULL,
    "indicador_id" VARCHAR(20) NOT NULL,
    "primer_evaluador_id" UUID NOT NULL,
    "segundo_evaluador_id" UUID,
    "valor_1" SMALLINT NOT NULL,
    "valor_2" SMALLINT,
    "discrepancia" SMALLINT,
    "tercer_revisor_id" UUID,
    "valor_final" SMALLINT NOT NULL,
    "decision_adjudicacion" TEXT,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_calidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_fichas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sistema_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "version_metodologia_id" UUID NOT NULL,
    "modificado_por" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_fichas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistema_score" (
    "sistema_id" UUID NOT NULL,
    "score_total" DECIMAL(5,2) NOT NULL,
    "cobertura_documental" DECIMAL(5,2) NOT NULL,
    "distribucion_0" INTEGER NOT NULL,
    "distribucion_1" INTEGER NOT NULL,
    "distribucion_2" INTEGER NOT NULL,
    "distribucion_3" INTEGER NOT NULL,
    "distribucion_na" INTEGER NOT NULL,
    "puntuacion_por_dimension" JSONB NOT NULL,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sistema_score_pkey" PRIMARY KEY ("sistema_id")
);

-- CreateIndex
CREATE INDEX "indicadores_dimension_id_idx" ON "indicadores"("dimension_id");

-- CreateIndex
CREATE INDEX "indicadores_version_metodologia_id_idx" ON "indicadores"("version_metodologia_id");

-- CreateIndex
CREATE UNIQUE INDEX "versiones_metodologia_numero_key" ON "versiones_metodologia"("numero");

-- CreateIndex
CREATE INDEX "instituciones_pais_idx" ON "instituciones"("pais");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "sistemas_institucion_id_idx" ON "sistemas"("institucion_id");

-- CreateIndex
CREATE INDEX "sistemas_version_metodologia_id_idx" ON "sistemas"("version_metodologia_id");

-- CreateIndex
CREATE INDEX "sistemas_estado_idx" ON "sistemas"("estado");

-- CreateIndex
CREATE INDEX "fuentes_sistema_id_idx" ON "fuentes"("sistema_id");

-- CreateIndex
CREATE INDEX "fuentes_analista_id_idx" ON "fuentes"("analista_id");

-- CreateIndex
CREATE INDEX "puntuaciones_sistema_id_idx" ON "puntuaciones"("sistema_id");

-- CreateIndex
CREATE INDEX "puntuaciones_indicador_id_idx" ON "puntuaciones"("indicador_id");

-- CreateIndex
CREATE UNIQUE INDEX "puntuaciones_sistema_id_indicador_id_evaluador_id_key" ON "puntuaciones"("sistema_id", "indicador_id", "evaluador_id");

-- CreateIndex
CREATE INDEX "fuentes_puntuaciones_fuente_id_idx" ON "fuentes_puntuaciones"("fuente_id");

-- CreateIndex
CREATE INDEX "control_calidad_sistema_id_idx" ON "control_calidad"("sistema_id");

-- CreateIndex
CREATE INDEX "control_calidad_indicador_id_idx" ON "control_calidad"("indicador_id");

-- CreateIndex
CREATE UNIQUE INDEX "control_calidad_sistema_id_indicador_id_key" ON "control_calidad"("sistema_id", "indicador_id");

-- CreateIndex
CREATE INDEX "historial_fichas_sistema_id_idx" ON "historial_fichas"("sistema_id");

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimensiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_version_metodologia_id_fkey" FOREIGN KEY ("version_metodologia_id") REFERENCES "versiones_metodologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sistemas" ADD CONSTRAINT "sistemas_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sistemas" ADD CONSTRAINT "sistemas_version_metodologia_id_fkey" FOREIGN KEY ("version_metodologia_id") REFERENCES "versiones_metodologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_analista_id_fkey" FOREIGN KEY ("analista_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntuaciones" ADD CONSTRAINT "puntuaciones_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntuaciones" ADD CONSTRAINT "puntuaciones_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntuaciones" ADD CONSTRAINT "puntuaciones_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes_puntuaciones" ADD CONSTRAINT "fuentes_puntuaciones_puntuacion_id_fkey" FOREIGN KEY ("puntuacion_id") REFERENCES "puntuaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes_puntuaciones" ADD CONSTRAINT "fuentes_puntuaciones_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_calidad" ADD CONSTRAINT "control_calidad_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_calidad" ADD CONSTRAINT "control_calidad_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_calidad" ADD CONSTRAINT "control_calidad_primer_evaluador_id_fkey" FOREIGN KEY ("primer_evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_calidad" ADD CONSTRAINT "control_calidad_segundo_evaluador_id_fkey" FOREIGN KEY ("segundo_evaluador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_calidad" ADD CONSTRAINT "control_calidad_tercer_revisor_id_fkey" FOREIGN KEY ("tercer_revisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_fichas" ADD CONSTRAINT "historial_fichas_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_fichas" ADD CONSTRAINT "historial_fichas_version_metodologia_id_fkey" FOREIGN KEY ("version_metodologia_id") REFERENCES "versiones_metodologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_fichas" ADD CONSTRAINT "historial_fichas_modificado_por_fkey" FOREIGN KEY ("modificado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sistema_score" ADD CONSTRAINT "sistema_score_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

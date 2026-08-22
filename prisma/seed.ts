import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DIMENSIONES = [
  { id: "D1", nombre: "Identificación y finalidad", peso: 15, orden: 1 },
  { id: "D2", nombre: "Base jurídica y responsabilidad", peso: 15, orden: 2 },
  { id: "D3", nombre: "Datos y privacidad", peso: 20, orden: 3 },
  { id: "D4", nombre: "Explicabilidad y documentación técnica", peso: 15, orden: 4 },
  { id: "D5", nombre: "Supervisión, derechos y reclamación", peso: 20, orden: 5 },
  { id: "D6", nombre: "Auditoría, desempeño y rendición de cuentas", peso: 15, orden: 6 },
];

const INDICADORES = [
  { id: "ITAD-01", nombre: "Nombre oficial y versión", dimensionId: "D1", pesoInterno: 4 },
  { id: "ITAD-02", nombre: "Finalidad pública", dimensionId: "D1", pesoInterno: 4 },
  { id: "ITAD-03", nombre: "Alcance y usuarios", dimensionId: "D1", pesoInterno: 4 },
  { id: "ITAD-04", nombre: "Institución responsable", dimensionId: "D1", pesoInterno: 3 },
  { id: "ITAD-05", nombre: "Base jurídica", dimensionId: "D2", pesoInterno: 4 },
  { id: "ITAD-06", nombre: "Responsable funcional", dimensionId: "D2", pesoInterno: 4 },
  { id: "ITAD-07", nombre: "Proveedor o desarrollador", dimensionId: "D2", pesoInterno: 4 },
  { id: "ITAD-08", nombre: "Contratación y costos", dimensionId: "D2", pesoInterno: 3 },
  { id: "ITAD-09", nombre: "Categorías de datos", dimensionId: "D3", pesoInterno: 5 },
  { id: "ITAD-10", nombre: "Origen y calidad de datos", dimensionId: "D3", pesoInterno: 5 },
  { id: "ITAD-11", nombre: "Privacidad y base legal", dimensionId: "D3", pesoInterno: 5 },
  { id: "ITAD-12", nombre: "Seguridad y conservación", dimensionId: "D3", pesoInterno: 5 },
  { id: "ITAD-13", nombre: "Descripción funcional", dimensionId: "D4", pesoInterno: 4 },
  { id: "ITAD-14", nombre: "Modelo y arquitectura", dimensionId: "D4", pesoInterno: 4 },
  { id: "ITAD-15", nombre: "Limitaciones y usos prohibidos", dimensionId: "D4", pesoInterno: 4 },
  { id: "ITAD-16", nombre: "Trazabilidad de resultados", dimensionId: "D4", pesoInterno: 3 },
  { id: "ITAD-17", nombre: "Supervisión humana", dimensionId: "D5", pesoInterno: 5 },
  { id: "ITAD-18", nombre: "Información a personas afectadas", dimensionId: "D5", pesoInterno: 5 },
  { id: "ITAD-19", nombre: "Explicación y revisión", dimensionId: "D5", pesoInterno: 5 },
  { id: "ITAD-20", nombre: "Reclamación y corrección", dimensionId: "D5", pesoInterno: 5 },
  { id: "ITAD-21", nombre: "Pruebas de desempeño", dimensionId: "D6", pesoInterno: 4 },
  { id: "ITAD-22", nombre: "Sesgos e impacto", dimensionId: "D6", pesoInterno: 4 },
  { id: "ITAD-23", nombre: "Auditoría independiente", dimensionId: "D6", pesoInterno: 4 },
  { id: "ITAD-24", nombre: "Monitoreo y actualización", dimensionId: "D6", pesoInterno: 3 },
];

// Rúbrica y pregunta evaluativa genéricas: la metodología ITAD 0.9 aún no define el
// texto final por indicador, así que se deja un placeholder consistente para poder
// probar el modelo de datos. Reemplazar con el contenido real del Anexo A.
const RUBRICA_PLACEHOLDER = {
  "0": "No hay evidencia disponible.",
  "1": "Cumplimiento mínimo: se menciona pero sin detalle verificable.",
  "2": "Cumplimiento parcial: hay evidencia, pero incompleta o desactualizada.",
  "3": "Cumplimiento pleno: evidencia completa, verificable y actualizada.",
};

async function main() {
  const versionMetodologia = await prisma.versionMetodologia.upsert({
    where: { numero: "0.9" },
    update: {},
    create: {
      numero: "0.9",
      fecha: new Date(),
      changelog: "Versión inicial ITAD 0.9",
      fechaEfectiva: new Date(),
    },
  });

  for (const dimension of DIMENSIONES) {
    await prisma.dimension.upsert({
      where: { id: dimension.id },
      update: { nombre: dimension.nombre, peso: dimension.peso, orden: dimension.orden },
      create: dimension,
    });
  }

  for (const indicador of INDICADORES) {
    await prisma.indicador.upsert({
      where: { id: indicador.id },
      update: {
        nombre: indicador.nombre,
        dimensionId: indicador.dimensionId,
        pesoInterno: indicador.pesoInterno,
      },
      create: {
        id: indicador.id,
        nombre: indicador.nombre,
        dimensionId: indicador.dimensionId,
        pesoInterno: indicador.pesoInterno,
        preguntaEvaluativa: `¿En qué medida el sistema documenta o cumple: "${indicador.nombre}"?`,
        rubrica: RUBRICA_PLACEHOLDER,
        versionMetodologiaId: versionMetodologia.id,
        activo: true,
      },
    });
  }

  console.log(`Versión de metodología: ${versionMetodologia.numero} (${versionMetodologia.id})`);
  console.log(`Dimensiones cargadas: ${DIMENSIONES.length}`);
  console.log(`Indicadores cargados: ${INDICADORES.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

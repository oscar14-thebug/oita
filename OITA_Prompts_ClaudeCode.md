# Prompts para Claude Code — Plataforma OITA

Un prompt por cada tarea de Jira (épica [SCRUM-6](https://oscprydev.atlassian.net/browse/SCRUM-6)). Cada quien puede tomar el ticket que le toque y pegar el prompt correspondiente directamente en Claude Code. Ejecutar en orden dentro de cada bloque (Setup → Datos → API → Frontend) porque hay dependencias.

---

## SCRUM-7 — Setup inicial del proyecto

```
Crea un proyecto Next.js 14+ (App Router, TypeScript) llamado "oita-platform" para la plataforma OITA (Observatorio Interamericano de Transparencia Algorítmica).

Configura:
- Tailwind CSS + shadcn/ui
- Prisma ORM conectado a PostgreSQL (variable de entorno DATABASE_URL, pensado para Supabase)
- ESLint + Prettier
- Estructura de carpetas: /app, /lib (con subcarpetas /lib/sistemas, /lib/evaluaciones, /lib/fuentes), /prisma

No implementes autenticación todavía, solo deja la estructura lista para agregarla después con Supabase Auth. Crea un README explicando cómo levantar el proyecto localmente.
```

---

## SCRUM-8 — Modelo de datos: esquema Prisma completo

```
Genera el archivo prisma/schema.prisma para la plataforma OITA con estas 11 tablas y sus relaciones (PostgreSQL):

[Pega aquí el contenido completo de OITA_Esquema_BD_v1.md — tiene cada tabla con columnas, tipos y notas de diseño]

Puntos importantes a respetar:
- dimensiones e indicadores son datos de configuración editables, con jsonb para la rúbrica del indicador
- puntuaciones guarda una fila por evaluador (no se sobrescribe), para poder comparar en la doble evaluación
- fuentes_puntuaciones es tabla puente N:N
- es_no_aplicable en puntuaciones requiere justificacion_na cuando es true

Después de crear el schema, corre `npx prisma format` y `npx prisma validate` para confirmar que compila.
```

---

## SCRUM-9 — Seed de los 24 indicadores ITAD y 6 dimensiones

```
Crea un script prisma/seed.ts que cargue en la base de datos:

1. Las 6 dimensiones:
D1 Identificación y finalidad (peso 15), D2 Base jurídica y responsabilidad (15), D3 Datos y privacidad (20), D4 Explicabilidad y documentación técnica (15), D5 Supervisión, derechos y reclamación (20), D6 Auditoría, desempeño y rendición de cuentas (15).

2. Los 24 indicadores con su dimensión y peso interno:
ITAD-01 Nombre oficial y versión (D1, 4), ITAD-02 Finalidad pública (D1, 4), ITAD-03 Alcance y usuarios (D1, 4), ITAD-04 Institución responsable (D1, 3), ITAD-05 Base jurídica (D2, 4), ITAD-06 Responsable funcional (D2, 4), ITAD-07 Proveedor o desarrollador (D2, 4), ITAD-08 Contratación y costos (D2, 3), ITAD-09 Categorías de datos (D3, 5), ITAD-10 Origen y calidad de datos (D3, 5), ITAD-11 Privacidad y base legal (D3, 5), ITAD-12 Seguridad y conservación (D3, 5), ITAD-13 Descripción funcional (D4, 4), ITAD-14 Modelo y arquitectura (D4, 4), ITAD-15 Limitaciones y usos prohibidos (D4, 4), ITAD-16 Trazabilidad de resultados (D4, 3), ITAD-17 Supervisión humana (D5, 5), ITAD-18 Información a personas afectadas (D5, 5), ITAD-19 Explicación y revisión (D5, 5), ITAD-20 Reclamación y corrección (D5, 5), ITAD-21 Pruebas de desempeño (D6, 4), ITAD-22 Sesgos e impacto (D6, 4), ITAD-23 Auditoría independiente (D6, 4), ITAD-24 Monitoreo y actualización (D6, 3).

3. Una versión de metodología inicial: numero "0.9", fecha de hoy, changelog "Versión inicial ITAD 0.9".

Agrega el script "seed" en package.json (prisma.seed) y ejecútalo para confirmar que carga sin errores.
```

---

## SCRUM-10 — API: catálogo de sistemas con filtros

```
En el proyecto oita-platform (Next.js + Prisma ya configurados), crea el endpoint GET /api/sistemas que:
- Devuelve la lista de sistemas con: id, nombre_oficial, institución (nombre + país), estado, score total (si ya existe en sistema_score) y perfil resumido.
- Acepta query params opcionales: pais, sector, institucionId, texto (búsqueda por nombre).
- Pagina resultados (limit/offset).

Escribe también un test básico que verifique que el filtro por país funciona.
```

---

## SCRUM-11 — API: ficha individual de sistema

```
Crea el endpoint GET /api/sistemas/[id] que devuelva la ficha completa de un sistema: datos de identificación, institución, las 24 puntuaciones (valor final, no las de cada evaluador por separado) con su indicador y dimensión, las fuentes citadas por cada puntuación, y el resumen (score total, score por dimensión, cobertura documental, distribución 0/1/2/3/NA).

Si el sistema no existe, devuelve 404 con un mensaje claro.
```

---

## SCRUM-12 — API: cálculo de score ITAD y cobertura documental

```
Crea una función lib/scoring/calcularScoreITAD.ts que, dado un sistemaId:
1. Traiga todas las puntuaciones finales (post control de calidad) de ese sistema.
2. Excluya del cálculo los indicadores marcados como N/A.
3. Aplique la fórmula: score = 100 * (suma(peso_indicador * valor/3)) / suma(peso_indicador de indicadores aplicables).
4. Calcule también el score por cada una de las 6 dimensiones (mismo principio, aplicado solo a los indicadores de esa dimensión).
5. Calcule cobertura documental: % del peso aplicable con al menos una fuente asociada (puntuación >= 1).
6. Devuelva también el conteo de indicadores en 0, 1, 2, 3 y N/A.

Escribe tests unitarios con al menos 3 casos: todos los indicadores aplicables, con algunos N/A, y con un sistema sin ninguna puntuación cargada todavía (debe devolver null o un estado "sin evaluar", no lanzar error).
```

---

## SCRUM-13 — API: registro de fuentes/evidencia

```
Crea los endpoints (protegidos, requieren sesión de analista):
- POST /api/sistemas/[id]/fuentes — crea una fuente (url_o_identificador, titulo, entidad_emisora, fecha_publicacion, fecha_consulta, nivel [A|B|C|D], fragmento, version_sistema_referida, notas). El analista_id sale de la sesión autenticada.
- GET /api/sistemas/[id]/fuentes — lista las fuentes de un sistema.

Valida que "nivel" sea uno de A, B, C, D y que fecha_consulta no sea futura.
```

---

## SCRUM-14 — API: registro de puntuaciones por indicador

```
Crea el endpoint POST /api/sistemas/[id]/puntuaciones que reciba: indicador_id, valor (0-3, opcional si es_no_aplicable=true), es_no_aplicable, justificacion_na (obligatorio si es_no_aplicable=true), nota_justificativa, y un array de fuente_id que sustentan esa puntuación (para poblar fuentes_puntuaciones). El evaluador_id sale de la sesión.

Importante: esto SIEMPRE crea una fila nueva (no actualiza una existente), porque puede haber más de un evaluador puntuando el mismo indicador — ver SCRUM-15 para cómo se resuelve eso.

Valida que si es_no_aplicable es true, justificacion_na no puede estar vacío.
```

---

## SCRUM-15 — API: control de calidad (doble evaluación y discrepancias)

```
Crea un endpoint GET /api/sistemas/[id]/control-calidad que, para cada indicador con más de una puntuación registrada, muestre: valor del primer evaluador, valor del segundo evaluador, y la discrepancia (diferencia absoluta).

Crea también POST /api/sistemas/[id]/control-calidad/[indicadorId]/resolver que reciba el valor_final y, si la discrepancia fue de 2 o 3 puntos, un tercer_revisor_id y decision_adjudicacion obligatorios. Guarda esto en la tabla control_calidad. El valor_final resuelto es el que debe usar el cálculo de score (SCRUM-12), no las puntuaciones individuales.
```

---

## SCRUM-16 — Autenticación y roles

```
Integra Supabase Auth en el proyecto oita-platform (Next.js App Router). Roles a soportar: analista, revisor, editor, admin — guardados en la tabla usuarios con un campo rol.

- El sitio público (catálogo, fichas, comparador, ranking) NO requiere login.
- Todas las rutas bajo /app/backoffice/* y los endpoints de escritura (POST/PUT de fuentes, puntuaciones, control de calidad) requieren sesión activa.
- Crea un middleware que redirija a /login si no hay sesión al entrar a /backoffice.
- Solo admin y editor pueden acceder a /backoffice/publicar (endpoint que marca una ficha como publicada en el catálogo público).
```

---

## SCRUM-17 — Frontend: pantalla Inicio/Explorar

```
Construye la página /app/page.tsx (Inicio/Explorar) de OITA usando Tailwind + shadcn/ui, consumiendo GET /api/sistemas.

Secciones: barra de navegación (Inicio, Explorar, Comparar, Ranking, Metodología, Sobre OITA, Recursos), hero con buscador, fila de estadísticas (total sistemas, países, sectores, indicadores ITAD, fecha última actualización), filtros por país/sector/institución, grid de "sistemas destacados" (tarjeta con bandera/país, sector, nombre, institución, score circular y badge de nivel de transparencia).

[Si ya está disponible, pega aquí el link o export del frame de Figma "01 - Inicio y Explorar" como referencia visual exacta de colores, espaciados y tipografía]
```

---

## SCRUM-18 — Frontend: pantalla Ficha individual de sistema

```
Construye /app/sistemas/[id]/page.tsx consumiendo GET /api/sistemas/[id].

Debe incluir: breadcrumb, encabezado con nombre/país/institución/score circular grande, tabs (Resumen, Indicadores, Evidencias, Documentos, Institución, Comentarios), barras de puntuación por las 6 dimensiones (valor /4), panel de información general, lista de evidencia destacada con link a cada fuente, y el disclaimer fijo: "OITA no certifica ni aprueba sistemas. Evalúa la transparencia algorítmica con base en información pública disponible."

[Pega aquí el link/export del frame de Figma correspondiente]
```

---

## SCRUM-19 — Frontend: pantalla Comparador

```
Construye /app/comparar/page.tsx: selector de 2 a 4 sistemas (buscador con autocompletado consumiendo /api/sistemas), y una tabla comparativa con columnas por sistema y filas por cada una de las 6 dimensiones (puntaje /4) más el score total, similar a la tabla "Vista de comparación" del boceto.
```

---

## SCRUM-20 — Frontend: pantalla Ranking / Tablero regional

```
Construye /app/ranking/page.tsx: vista agregada de todos los sistemas con filtros por país, sector y dimensión, mostrando promedios y distribución. Usa Recharts para al menos un gráfico de barras (score promedio por país o sector).
```

---

## SCRUM-21 — Backoffice: formulario de captura de ficha completa

```
Construye /app/backoffice/sistemas/nuevo/page.tsx (y edición en /app/backoffice/sistemas/[id]/editar) — formulario multi-sección para analistas autenticados:
1. Identificación (nombre, institución, país, sector, versión, estado)
2. Elegibilidad (checklist justificando los 5 criterios de la puerta de entrada)
3. Contexto (finalidad, proceso, usuarios, población afectada, grado de automatización)
4. Fuentes (agregar/editar evidencia — usa el endpoint de SCRUM-13)
5. Puntuaciones (formulario de los 24 indicadores con selector 0-3/N.A., nota justificativa y selección de fuentes que la sustentan — usa el endpoint de SCRUM-14)

Guarda como borrador hasta que un editor lo publique (ver rol editor de SCRUM-16).
```

---

## SCRUM-22 — Deploy inicial en Vercel + Supabase

```
Prepara el proyecto oita-platform para desplegar en Vercel conectado a un proyecto Supabase (Postgres + Auth). Documenta en el README los pasos: variables de entorno necesarias (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY, etc.), comando de migración de Prisma en producción (prisma migrate deploy), y cómo correr el seed en el ambiente de staging.
```

---

## SCRUM-23 — [Backlog Fase 2] Asistente de búsqueda con IA

```
(No implementar para el MVP del 27 de agosto — dejar para después)

Cuando se retome: crear POST /api/backoffice/sugerir-busqueda que reciba nombre de sistema + institución y devuelva, vía la API de Anthropic, una lista de strings de búsqueda sugeridos (no contenido real de la web). El endpoint no debe tener permiso de escritura sobre fuentes ni puntuaciones — solo devuelve sugerencias en pantalla, marcadas como "Sugerencia de IA — sin verificar", para que el analista las use manualmente.
```

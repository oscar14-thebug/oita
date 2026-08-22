@AGENTS.md

## Proyecto: OITA (Observatorio Interamericano de Transparencia Algorítmica)

### Qué es

Plataforma que documenta y evalúa sistemas algorítmicos usados por instituciones públicas en América Latina, contra una metodología de 24 indicadores (ITAD) en 6 dimensiones. Es un sistema de curación HUMANA — analistas cargan evidencia y puntúan manualmente, la app solo agrega/calcula, nunca decide puntuaciones ni descubre sistemas de forma autónoma.

### Stack

Next.js 16 (App Router, TypeScript) full-stack — no hay backend separado, /app/api/\* son las rutas de API. Prisma + PostgreSQL (Supabase). Tailwind + shadcn/ui. Auth con Supabase Auth vía @supabase/ssr. Vitest para tests.

### Comandos

- npm run dev — levanta frontend + API juntos en localhost:3000
- npx prisma migrate dev — aplica migraciones
- npm run db:seed — carga las 6 dimensiones y 24 indicadores iniciales
- npm test — corre tests con Vitest

### Decisiones importantes (no cambiar sin discutir)

- Next.js 16 usa proxy.ts en vez de middleware.ts — protege /backoffice/\*.
- Tabla puntuaciones: SIEMPRE se inserta una fila nueva por evaluador, nunca se actualiza una existente (necesario para la doble evaluación / control de calidad).
- Campo Sistema.publicado (boolean): el catálogo público y las fichas individuales solo muestran sistemas con publicado:true. Los borradores dan 404 si no estás autenticado como admin/editor.
- usuarios.id debe ser idéntico al UID que genera Supabase Auth para ese usuario (fila espejo).
- Bandas de score: 0-24 muy baja, 25-49 baja, 50-74 intermedia, 75-89 alta, 90-100 muy alta (ver lib/scoring).
- Fórmula ITAD: 100 × Σ(peso_indicador × valor/3) / Σ(peso_indicador aplicable), excluye indicadores N/A.

### Docs de referencia en este repo

- OITA_Diseno_a_Codigo.md — tokens de color/Tailwind y guía de las pantallas del frontend.
- OITA_Prompts_ClaudeCode.md — prompt original de cada ticket de Jira (SCRUM-7 a SCRUM-23).

### Backlog (Jira, proyecto SCRUM)

SCRUM-7 a SCRUM-21: **Finalizada** en Jira, completos y verificados en navegador contra Supabase real (setup, schema, seed, API, auth, frontend público — Inicio/Explorar, Ficha individual, Comparador, Panorama regional —, y backoffice de carga/edición).

Pendiente:

- **SCRUM-22** — Deploy en Vercel + Supabase (staging). Es lo único que falta del MVP del 27 de agosto. Todavía en estado "Idea" en Jira, no arrancado.
- **SCRUM-23** — Asistente de búsqueda con IA. Explícitamente Fase 2 en la descripción del ticket — no implementar todavía.

### Otros cabos sueltos (no son tickets propios, pero importan para la demo del 27 de agosto)

1. **Contenido placeholder pendiente de reemplazo real**: los 5 criterios de "elegibilidad" (`lib/sistemas/elegibilidad.ts`) y las rúbricas 0-3 de los 24 indicadores (`prisma/seed.ts`) son texto genérico que puse yo porque nunca llegó el texto real de la metodología ITAD 0.9 — están marcados como placeholder en el código. Reemplazar antes de usar contenido real.
2. **Links del NavBar sin página propia**: "Metodología", "Sobre OITA" y "Recursos" apuntan a `/metodologia`, `/sobre-oita`, `/recursos` — rutas que no existen todavía (404 si se hace click). No hay ticket de Jira para esto.
3. **Alta de usuarios 100% manual**: solo existe el usuario admin creado a mano (Supabase Dashboard + fila espejo en `usuarios`, ver README → "Aprovisionar usuarios"). No hay UI para invitar analistas/revisores/editores.
4. **Sin datos reales cargados**: la base quedó limpia (se borraron todos los datos usados para probar cada ticket). Antes de la demo hay que cargar sistemas reales vía `/backoffice`.

### Naming: "Panorama regional", nunca "Ranking"

Confirmado por el equipo metodológico (22-ago-2026, ver SCRUM-20): la vista agregada de sistemas (`/panorama-regional`) puede ordenarse por puntuación ITAD, pero siempre junto con filtros/comparaciones/contexto — nunca como leaderboard aislado de "mejores algoritmos". En toda la interfaz pública (NavBar incluido) el nombre es "Panorama regional" o "Tablero regional"; no reintroducir "Ranking" en texto visible, rutas o nombres de componente.

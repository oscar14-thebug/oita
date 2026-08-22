# OITA — Observatorio Interamericano de Transparencia Algorítmica

Plataforma para evaluar y publicar la transparencia algorítmica de sistemas de decisión
automatizada usados por instituciones públicas, siguiendo la metodología ITAD (6
dimensiones, 24 indicadores).

> Ver `OITA_Prompts_ClaudeCode.md` para el backlog completo (tickets SCRUM-7 a SCRUM-23)
> que ordena la construcción de este proyecto.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** + **shadcn/ui** (componentes en `components/ui`)
- **Prisma ORM 7** sobre **PostgreSQL** (Supabase), con driver adapter (`@prisma/adapter-pg`)
- **Supabase Auth** (`@supabase/ssr`) — login por email/password, roles en `Usuario.rol`
- **ESLint + Prettier**
- **Vitest** para tests unitarios

## Estructura de carpetas

```
app/
  api/                    # Route handlers (GET/POST /api/sistemas, /fuentes, ...)
  login/                  # Login (Supabase Auth, client component)
  backoffice/             # Rutas protegidas por proxy.ts
components/ui/            # Componentes shadcn/ui
lib/
  prisma.ts               # Singleton de PrismaClient (driver adapter pg)
  generated/prisma/        # Cliente Prisma generado (no editar, gitignored)
  supabase/                # Clientes Supabase (server, browser, proxy)
  auth/                    # Sesión actual + control de roles
  http/                    # Traducción de errores de dominio a respuestas HTTP
  sistemas/                # Queries/mutaciones de catálogo, ficha y publicación
  evaluaciones/            # Reglas de puntuaciones, control de calidad, resumen
  scoring/                 # Fórmula de score ITAD (SCRUM-12)
  fuentes/                 # Queries/mutaciones de evidencia documental
prisma/
  schema.prisma            # Modelo de datos (12 tablas, ver notas abajo)
  seed.ts                  # Carga dimensiones, indicadores y versión de metodología
  migrations/
proxy.ts                   # Protege /backoffice/* (reemplaza a middleware.ts en Next 16)
```

## Requisitos

- Node.js 20+
- Una base PostgreSQL (Supabase recomendado — plan gratuito alcanza para el MVP)

## Puesta en marcha local

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Completa `DATABASE_URL` con la cadena de conexión de tu base. Con Supabase:

   - Ve a **Project Settings → Database** (o el botón **Connect** del dashboard).
   - Si tu red **no tiene salida IPv6**, la conexión directa (`db.<ref>.supabase.co:5432`)
     no va a conectar (solo tiene registro DNS AAAA). Usa en su lugar el
     **Session pooler** (`aws-0-<región>.pooler.supabase.com:5432`, usuario
     `postgres.<project-ref>`) — es compatible con IPv4 y sí soporta migraciones.
   - No uses el _Transaction pooler_ (puerto 6543) para `DATABASE_URL`: su modo
     pgbouncer no es compatible con `prisma migrate`.

   > Nota: la versión de Prisma usada (7.9) no soporta `directUrl` en
   > `prisma.config.ts` — una sola `DATABASE_URL` sirve tanto para runtime como para
   > migraciones.

   Completa también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Supabase → **Project Settings → API**) para que `/login` funcione.

3. **Generar el cliente Prisma y migrar**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Cargar datos iniciales** (6 dimensiones, 24 indicadores ITAD, versión de
   metodología "0.9"; es idempotente, se puede correr varias veces)

   ```bash
   npm run db:seed
   ```

5. **Levantar el servidor de desarrollo**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000). Prueba la API:

   ```bash
   curl http://localhost:3000/api/sistemas
   ```

## Scripts

| Script                 | Qué hace                                         |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Servidor de desarrollo (Turbopack)               |
| `npm run build`        | Build de producción                              |
| `npm run lint`         | ESLint                                           |
| `npm run format`       | Prettier (escribe)                               |
| `npm run format:check` | Prettier (solo verifica)                         |
| `npm run test`         | Corre los tests con Vitest                       |
| `npm run db:generate`  | Regenera el cliente Prisma (`prisma generate`)   |
| `npm run db:migrate`   | Crea/aplica una migración (`prisma migrate dev`) |
| `npm run db:seed`      | Corre `prisma/seed.ts`                           |
| `npm run db:studio`    | Abre Prisma Studio para explorar los datos       |

## Modelo de datos

`prisma/schema.prisma` implementa las 12 tablas de `OITA_Esquema_BD_v1.md`:

- **Configuración** (editable sin desplegar código): `Dimension`, `Indicador`
  (rúbrica en `jsonb`), `VersionMetodologia`.
- **Contenido**: `Institucion`, `Usuario`, `Sistema` (la "ficha"), `Fuente`.
- **Evaluación**: `Puntuacion` (una fila por evaluador — nunca se sobrescribe, para
  poder comparar la doble evaluación), `FuentePuntuacion` (puente N:N entre
  puntuaciones y fuentes), `ControlCalidad` (resuelve la discrepancia entre
  evaluadores y fija el `valorFinal` publicado), `HistorialFicha`, `SistemaScore`
  (resumen cacheado, opcional para el catálogo chico del MVP).

Reglas de negocio que **no** se expresan como constraint de base de datos (Prisma no
soporta CHECK constraints condicionales) y por eso se validan en el límite de
escritura, en `lib/evaluaciones/reglas.ts`:

- Si `Puntuacion.esNoAplicable` es `true`, `justificacionNa` es obligatoria.
- Si no es N/A, `valor` (0-3) es obligatorio.

`Sistema.publicado` (booleano, default `false`) no está en `OITA_Esquema_BD_v1.md`
original — se agregó en SCRUM-16 para poder distinguir borrador vs. publicado en el
catálogo público.

## API

| Endpoint                                                    | Método | Notas                                                                                          |
| ----------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `/api/sistemas`                                             | GET    | Catálogo público (solo `publicado: true`); filtros pais/sector/institucionId/texto, paginación |
| `/api/sistemas/[id]`                                        | GET    | Ficha completa (solo publicados); 404 si no existe/no está publicado                           |
| `/api/sistemas/[id]/fuentes`                                | GET    | Lista fuentes del sistema                                                                      |
| `/api/sistemas/[id]/fuentes`                                | POST   | Requiere sesión (rol analista/editor/admin)                                                    |
| `/api/sistemas/[id]/puntuaciones`                           | POST   | Requiere sesión; siempre inserta (nunca actualiza)                                             |
| `/api/sistemas/[id]/control-calidad`                        | GET    | Discrepancias entre 1er/2do evaluador por indicador                                            |
| `/api/sistemas/[id]/control-calidad/[indicadorId]/resolver` | POST   | Adjudica `valor_final`; exige tercer revisor si discrepancia ≥ 2                               |
| `/api/sistemas/[id]/publicar`                               | POST   | Solo admin/editor; marca la ficha como publicada                                               |

## Autenticación

**Supabase Auth**, integrado con `@supabase/ssr`. Roles: `analista`, `revisor`,
`editor`, `admin` (campo `Usuario.rol`).

- El sitio público (`/`, `/api/sistemas*` en lectura) no requiere login.
- `proxy.ts` protege todo `/backoffice/*`: sin sesión, redirige a `/login`.
- Los endpoints de escritura (`POST` de fuentes/puntuaciones/control-calidad/publicar)
  validan la sesión en el propio route handler (`lib/auth/sesion.ts`), no vía proxy.

### Aprovisionar usuarios

Supabase Auth (tabla interna `auth.users`) y la tabla `usuarios` de esta app son
distintas. Para que alguien pueda loguearse **y** que la app reconozca su rol, la fila
en `usuarios` debe tener el **mismo `id`** que su usuario de Supabase Auth:

1. Crea el usuario en Supabase → **Authentication → Users → Add user** (o que se
   registre) y copia su UUID.
2. Inserta la fila correspondiente en `usuarios` con ese mismo `id` y el `rol` deseado
   (por ahora, a mano — `npm run db:studio` o SQL directo; no hay UI de gestión de
   usuarios todavía).

### Probar

```bash
npm run dev
```

Visita `/backoffice` sin sesión → redirige a `/login`. Inicia sesión con un usuario
provisionado como se indicó arriba → vuelve a `/backoffice` y ya puede usar los
endpoints de escritura.

# De Figma a código — tokens de diseño y prompt para continuar sin depender de Figma

Mientras se resuelve el límite de llamadas del plan de Figma, seguimos avanzando: en vez de esperar a terminar el diseño ahí, construimos el frontend real en Next.js directamente con el sistema de colores y patrones que ya definimos en las dos pantallas que sí se alcanzaron a construir ("01 - Inicio y Explorar" y "02 - Ficha Individual").

Esto es completamente viable para un MVP de una semana: el código termina siendo la fuente de verdad, y si más adelante recuperamos acceso a Figma, se puede sincronizar el diseño desde el código corriendo (existe una función para eso), en vez de al revés.

## 1. Paleta de colores (tokens)

Estos son los colores que usamos al construir las pantallas en Figma, aproximados visualmente a partir de las capturas (no son el hex exacto guardado en las variables de Figma, que no pude leer por el límite de llamadas — pero son consistentes con lo que se ve en pantalla y sirven perfectamente para construir el código ahora; se pueden afinar más adelante si hace falta pixel-perfect).

| Token         | Uso                                                           | Hex aproximado        |
| ------------- | ------------------------------------------------------------- | --------------------- |
| `neutral-50`  | Fondo general de la app                                       | `#FFFFFF` / `#F8FAFC` |
| `neutral-200` | Bordes, separadores                                           | `#E5E7EB`             |
| `neutral-500` | Texto secundario                                              | `#6B7280`             |
| `neutral-900` | Texto principal                                               | `#111827`             |
| `navy-900`    | Fondo del Hero y del header de ficha individual               | `#0B1220`             |
| `teal-500`    | Color de marca / acento (logo, botón "Buscar", links activos) | `#0D9488`             |
| `success-500` | Score alto (75-100)                                           | `#16A34A`             |
| `warning-500` | Score intermedio (50-74)                                      | `#D97706`             |
| `danger-500`  | Score bajo (0-49)                                             | `#DC2626`             |

## 2. Tailwind config (extend)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        neutral: {
          50: "#FFFFFF",
          200: "#E5E7EB",
          500: "#6B7280",
          900: "#111827",
        },
        navy: { 900: "#0B1220" },
        teal: { 500: "#0D9488" },
        success: { 500: "#16A34A" },
        warning: { 500: "#D97706" },
        danger: { 500: "#DC2626" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
```

## 3. Bandas de score (regla de negocio, ya usada en el diseño)

Según el documento metodológico (sección de interpretación del score ITAD):

- 0–24: muy baja → `danger`
- 25–49: baja → `danger`
- 50–74: intermedia → `warning`
- 75–89: alta → `success`
- 90–100: muy alta → `success`

## 4. Qué ya está resuelto visualmente (para replicar en código)

**Pantalla "Inicio / Explorar":**
NavBar (logo + 7 links) → Hero navy con headline + buscador → fila de filtros (País / Sector / Institución / Palabra clave) → fila de 4 estadísticas → sección "Sistemas destacados" con grid de 3 tarjetas (país, sector, nombre, institución, círculo de score con color según banda + "Transparencia alta/intermedia/baja").

**Pantalla "Ficha individual de sistema":**
NavBar → header navy con breadcrumb, tags (país/sector/estado), nombre del sistema, institución, badge grande de score → sección "Puntuación por dimensión" (barra de progreso por cada una de las 6 dimensiones, valor sobre 3.0, peso %) → sección "Indicadores" (tabla con ID, pregunta, cantidad de fuentes, pill de puntuación 0-3 coloreada) → sección "Fuentes citadas" (nivel A-D, título, dominio, fecha).

Puedes ver ambas pantallas abriendo directamente el archivo en el navegador (esto **no** consume la cuota de la API, solo el acceso normal a Figma sí funciona):
https://www.figma.com/design/0xDZUrEwteTBG3UIvXXxpx/OITA

## 5. Prompt listo para Claude Code

```
Configura el sistema de diseño de OITA en el proyecto Next.js + Tailwind + shadcn/ui:

1. Agrega estos tokens de color al tailwind.config.js (extend.colors): neutral (50 #FFFFFF, 200 #E5E7EB, 500 #6B7280, 900 #111827), navy (900 #0B1220), teal (500 #0D9488), success (500 #16A34A), warning (500 #D97706), danger (500 #DC2626). Usa font-family Inter.

2. Crea una función utilitaria getScoreBand(score: number) que devuelva { nivel: string, color: "success"|"warning"|"danger" } según estas bandas: 0-24 "muy baja" (danger), 25-49 "baja" (danger), 50-74 "intermedia" (warning), 75-89 "alta" (success), 90-100 "muy alta" (success). Debe usarse en cualquier componente que muestre un score ITAD.

3. Construye el componente <NavBar /> reutilizable: logo (círculo teal-500 + texto "OITA" bold) a la izquierda, y a la derecha los links Inicio / Explorar / Comparar / Ranking / Metodología / Sobre OITA / Recursos.

4. Construye la página Home/Explorar (/):
   - Hero: fondo navy-900, headline "Transparencia algorítmica para democracias más fuertes", subtítulo, barra de búsqueda blanca con botón "Buscar" teal-500.
   - Fila de filtros: dropdowns País / Sector / Institución + input de texto "Palabra clave...".
   - Fila de 4 estadísticas (número grande + label): Sistemas evaluados, Países (piloto), Sectores, Indicadores ITAD — estos números deben venir de datos reales (query a la base), no hardcodeados.
   - Sección "Sistemas destacados": grid de SystemCard (país, sector, nombre, institución, círculo de score coloreado con getScoreBand + "Transparencia {nivel}").

5. Construye la página de Ficha Individual (/sistemas/[id]):
   - Header navy-900: breadcrumb, tags (país/sector/estado), nombre del sistema, institución + fecha de última revisión, badge grande de score (círculo o pill con borde del color de getScoreBand).
   - Sección "Puntuación por dimensión": una fila por cada una de las 6 dimensiones (nombre, peso %, barra de progreso rellenada según score/3.0, valor "X.X / 3.0").
   - Sección "Indicadores": tabla agrupable por dimensión con ID (ITAD-01...), pregunta evaluativa, cantidad de fuentes citadas, pill de puntuación 0-3 coloreada con getScoreBand adaptado a escala 0-3.
   - Sección "Fuentes citadas": lista con nivel (A/B/C/D como pill), título, dominio (link), fecha de consulta.

Todo el contenido debe salir de la base de datos vía Prisma (ver esquema en OITA_Esquema_BD_v1.md) — nada de datos hardcodeados salvo mientras no haya seed data, en cuyo caso usa datos de ejemplo claramente marcados como "(ejemplo)".

Después de estas dos pantallas, construye siguiendo el mismo sistema de diseño:
- /comparar: selector de 2-3 sistemas + radar chart (Recharts) superponiendo su puntuación por dimensión + tabla comparativa de indicadores.
- /ranking: tabla ordenable por score total, con filtros de país/sector, y un mapa o agrupación simple por país.
```

---

_Esta ruta no depende de más llamadas a la API de Figma. Cuando se resuelva el tema del plan (upgrade o reinicio mensual), se puede retomar el diseño en Figma para las pantallas de Comparador y Ranking, o simplemente dejar que el código sea la referencia final — lo que el equipo prefiera dado el tiempo que queda._

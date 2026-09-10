# . — Backend de Comunidad UTHH

Monolito modular en TypeScript, desplegado en **Cloudflare Workers**. Es
una de las dos apps del monorepo el proyecto El Aula Informa;
la otra es [`../student-community-platform-web`](../frontend) (Next.js, en Vercel). No comparten runtime
ni base de datos — se comunican por HTTP.

---

## Tabla de contenido

- [Qué hace](#qué-hace)
- [Arquitectura](#arquitectura)
- [Stack](#stack)
- [Estructura](#estructura)
- [Módulos](#módulos)
- [Comunicación por eventos](#comunicación-por-eventos)
- [Modelo de datos](#modelo-de-datos)
- [Roles](#roles)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Scripts](#scripts)
- [Despliegue](#despliegue)
- [Variables de entorno](#variables-de-entorno)
- [ADRs](#adrs-architectural-decision-records)
- [Hoja de ruta](#hoja-de-ruta)
- [Convenciones de código](#convenciones-de-código)

---

## Qué hace

Un mismo backend, una sola base de datos, varias interfaces en el cliente. Es una plataforma
de sociedad estudiantil, no un tablero de datos: el peso está en la participación (testimonios,
avisos, eventos, propuestas, reportes), no en gráficas ni reportes exportables.

1. **Muro unificado (scroll infinito)** → un feed con Avisos, Eventos, Testimonios, Propuestas
   y Reportes. Vista *swiper* en celular para votar rápido y vista *foro* permanente en laptop
   para consulta pública. Cada testimonio se puede publicar con alias visible o anónimo.
2. **Avisos, Eventos y Propuestas** → contenido estructurado del módulo `contenido`; los
   avisos/eventos oficiales solo los publica la cuenta «Sociedad Estudiantil», las propuestas
   las abre cualquier alumno verificado.
3. **Reportes de irregularidades** (antes «portal de denuncia») → texto libre con evidencia y
   validación comunitaria («fui testigo»). Se habilita al final (ver [hoja de ruta](#hoja-de-ruta)).

*(El módulo `firmas` sigue existiendo en el backend por si se retoma como conteo simple de
respaldo, pero no hay tablero visual ni exportación a PDF — no encajan con lo que queremos ser: una asociación estudiantil, no un observatorio de datos.)*

---

## Arquitectura

**Monolito modular**, no microservicios. Se adopta el patrón del repositorio de referencia
[`mgce/modular-monolith-nodejs`](https://github.com/mgce/modular-monolith-nodejs): un único
backend desplegable, con módulos internos aislados que se comunican por eventos.

Diferencia con el repo de referencia: allí el runtime es Node + Express + Awilix + MikroORM +
Redis + Docker. Aquí el runtime es **Cloudflare Workers**, que no es Node estándar. Se
conserva el *patrón* (módulos + eventos + ADRs) y cambian las librerías. La justificación
está en [`docs/adr/0002-runtime-cloudflare-workers.md`](docs/adr).

```
┌──────────────┐        HTTPS         ┌─────────────────────────┐        ┌────────────────┐
│ ../student-community-platform-web│  ───────────────▶    │ . (este dir.)│  ────▶ │  PostgreSQL     │
│  Next.js     │   api.dominio.mx     │  Hono @ CF Workers      │ pooler │  Supabase       │
│  @ Vercel    │  ◀───────────────    │  módulos + eventos      │  ◀──── │  (solo la BD)   │
└──────────────┘                      └───────────┬─────────────┘        └────────────────┘
                                                  │
                                      ┌───────────┴───────────┐
                                      │  Cloudflare R2        │  ← evidencia de denuncias
                                      │  Cron Triggers        │  ← scheduler
                                      └──────────────────────┘
```

Front y back se sirven bajo el **mismo dominio con subdominios** (`dominio.mx` → Vercel,
`api.dominio.mx` → Workers) para que las cookies de sesión sean *same-site*.

### Dos niveles de complejidad por módulo

| Nivel | Estructura | Módulos |
|---|---|---|
| **CRUD** | `api/` + `core/` (DTOs, entidades, repositorios, servicios) | firmas, muro, contenido, moderacion, notificaciones |
| **Clean Architecture** | `api/` → `infrastructure/` → `application/` → `domain/` (dependencia estricta hacia adentro) | identidad, denuncias |

---

## Stack

| Capa | Elección |
|---|---|
| Lenguaje | TypeScript |
| Framework HTTP | [Hono](https://hono.dev) (pensado para Workers) |
| Runtime / hosting | Cloudflare Workers |
| Base de datos | PostgreSQL en Supabase; el esquema lo crea `db/comunidad_uthh.sql` |
| Acceso a datos | [Drizzle ORM](https://orm.drizzle.team) como **espejo tipado** (sin migraciones) |
| Conexión a la BD | Pooler de Supabase con el rol `app_backend`; opcional Hyperdrive delante |
| Validación | [Zod](https://zod.dev) |
| Autenticación | **Supabase Auth** (OTP con correo institucional); el Worker valida el JWT contra el JWKS |
| Bus de eventos | Patrón *outbox* en PostgreSQL (sin costo) o Cloudflare Queues (plan Workers Paid) |
| Tareas programadas | Cloudflare Cron Triggers (llaman funciones de la base) |
| Archivos | **Cloudinary** (imágenes del sistema y evidencia `private`) |
| Moderación automática | Filtro local de palabras + OpenAI Moderation API / Perspective API (gratis) |
| Tests | [Vitest](https://vitest.dev) + `@cloudflare/vitest-pool-workers` |
| Lint / formato | ESLint + Prettier |
| CLI de despliegue | [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |

---

## Estructura

```
./
├── docs/adr/                          # Architectural Decision Records
├── src/
│   ├── index.ts                      # arma la app Hono y monta cada módulo
│   ├── scheduler.ts                  # entrypoint de los Cron Triggers
│   ├── env.ts                        # Bindings del Worker
│   ├── shared/
│   │   ├── db/        client.ts  schema.ts (barrel)  outbox.schema.ts
│   │   ├── events/     bus.ts  dispatcher.ts  types.ts
│   │   ├── auth/       session.ts  middleware.ts
│   │   ├── http/       error.ts  cors.ts  validate.ts
│   │   └── ranking/    score.ts              # fórmula pública del muro
│   ├── modules/
│   │   ├── module.ts                 # interfaz AppModule (contrato común)
│   │   ├── identidad/                # Clean Architecture
│   │   ├── firmas/                   # CRUD
│   │   ├── muro/                     # CRUD
│   │   ├── contenido/                # CRUD
│   │   ├── denuncias/                # Clean Architecture
│   │   ├── moderacion/               # CRUD
│   │   └── notificaciones/           # CRUD
│   └── scheduler/jobs/
│       ├── reconciliar-padron.ts
│       ├── recalcular-ranking.ts
│       ├── refrescar-estadisticas.ts
│       └── cerrar-encuestas.ts
├── drizzle/                          # migraciones SQL generadas
├── tests/
├── wrangler.toml
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

> El archivo `.dev.vars` (con los secretos locales) **no está en el repo**;
> lo comparte aparte quien administra los secretos del equipo.

### El contrato `AppModule`

Cada módulo exporta un objeto que implementa esta interfaz. `src/index.ts` los recorre y los
monta:

```ts
// src/modules/module.ts
export interface AppModule {
  readonly slug: string;
  registerRoutes(app: Hono<AppEnv>): void;
  readonly eventHandlers?: Partial<{
    [K in IntegrationEvent["type"]]: (payload, ctx: ModuleContext) => Promise<void>;
  }>;
}
```

---

## Módulos

| Módulo | Nivel | Responsabilidad |
|---|---|---|
| **identidad** | Clean | Alta con correo institucional, verificación contra el padrón, roles, cuenta «Sociedad Estudiantil», paso a *no verificado* al darse de baja |
| **firmas** | CRUD | Registro de la firma de respaldo (una por usuario) y agregados por programa |
| **muro** | CRUD | Testimonios desde plantilla, votos/swipes, feed con scroll infinito, ranking, #hashtags, filtros |
| **contenido** | CRUD | Avisos, eventos, novedades, propuestas y encuestas del feed |
| **denuncias** | Clean | Tickets, evidencia en R2, confirmaciones «fui testigo», umbral que retira la marca *no verificado* |
| **moderacion** | CRUD | Filtro local + API externa, detección de datos personales, reportes de la comunidad, auto-ocultado, bitácora de auditoría |
| **notificaciones** | CRUD | Avisos al usuario (respuestas, recordatorios de eventos, cambios de estado, resultado de moderación) |

---

## Comunicación por eventos

- **Eventos de dominio** — síncronos, dentro de un mismo módulo, vía un mediador en memoria.
- **Eventos de integración** — entre módulos. Se publican con **patrón outbox**: el productor
  escribe una fila en `eventos_integracion` dentro de la misma transacción; un *dispatcher*
  (disparado por Cron Trigger, ver `src/scheduler.ts`) los entrega a los `eventHandlers` de
  los módulos suscritos y los marca como procesados.

| Evento | Publica | Reaccionan |
|---|---|---|
| `FirmaRegistrada` | firmas | notificaciones, scheduler (estadísticas) |
| `TestimonioPublicado` | muro | moderacion (encola revisión) |
| `ContenidoReportadoNVeces` | moderacion | muro / contenido (oculta) |
| `DenunciaAlcanzoUmbral` | denuncias | denuncias (retira marca), notificaciones |
| `AlumnoDadoDeBaja` | identidad | identidad (baja el rol, invalida sesión), notificaciones |

---

## Modelo de datos

**La base la crea `db/comunidad_uthh.sql`** (fuente de verdad, se corre en
Supabase → SQL Editor). 30 tablas en `public` + `privado`, 3 vistas
(`vista_muro`, `vista_cola_moderacion`, `vista_estadisticas_programa`),
funciones (`recalcular_ranking()`, `purgar_antiguos()`, `archivos_huerfanos()`,
`anonimizar_usuario()`), triggers de contadores y validación, RLS y semilla.
`db/pruebas_comunidad_uthh.sql` tiene 40 pruebas. Detalle: `db/INSTRUCCIONES.txt`
y `docs/diagramas/`.

Drizzle (`src/**/schema.ts`) es solo el **espejo tipado** para el query
builder — **no se generan migraciones desde el código**. Reglas clave:

- Los **contadores** los mantienen triggers; el backend solo los lee.
- El feed y el swiper leen de la **vista `vista_muro`** (resuelve el anonimato).
- El ranking es `select recalcular_ranking()` (cron), no un bucle en el Worker.
- Auth = Supabase Auth; el Worker valida el JWT contra el JWKS del proyecto.
- Conexión con el rol **`app_backend`** (mínimo privilegio).

---

## Roles

Solo dos roles. No hay moderadores ni administradores como rol dentro de la app.

| Rol | Quién es | Puede |
|---|---|---|
| **no verificado** | Visitante sin cuenta institucional confirmada, o alumno dado de baja / egresado | Solo lectura |
| **verificado** | Correo institucional confirmado y (cuando exista padrón) inscripción activa | Publicar cualquier tipo de tarjeta, votar, firmar, comentar, confirmar denuncias, reportar, crear propuestas y encuestas |

Los avisos y novedades «oficiales» se publican desde la cuenta compartida **«Sociedad
Estudiantil»** (una cuenta verificada normal, marcada con `cuenta_oficial`, cuyo acceso
comparte el núcleo del proyecto). La moderación la resuelven el filtro automático, el reporte
comunitario con auto-ocultado y la revisión manual del equipo desde un área protegida.

---

## Puesta en marcha local

Esta app es independiente (el frontend vive en `student-community-platform-web`).

### Requisitos

- Node.js 20+
- La base ya está creada en Supabase (la administra `db/comunidad_uthh.sql`, no hay
  migraciones que correr aquí)

### Pasos

```bash
npm install
# copiar el archivo .dev.vars que te pasó el equipo (no está en el repo)
npm run dev                       # API en http://localhost:8787
```

Variables del `.dev.vars`: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWKS_URL`,
`IDENTITY_PEPPER`, `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`,
`FRONTEND_ORIGIN`, `INSTITUTIONAL_EMAIL_DOMAIN`, y opcionales `SUPABASE_SECRET_KEY`,
`CLOUDINARY_*`, `OPENAI_API_KEY`.

`npm run dev` (`scripts/dev.mjs`) carga las variables `WRANGLER_*` de `.dev.vars`
antes de arrancar `wrangler dev`. Eso hace que el binding **HYPERDRIVE** enrute la
conexión a Supabase por Node en local; sin ello, el driver `postgres` se cuelga
dentro de Miniflare y los endpoints que tocan la BD no responden.

Antes de `npm run deploy` hay que crear el Hyperdrive real y poner su `id` en
`wrangler.toml` (ver el comentario en ese archivo).

---

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Worker en local con `wrangler dev` |
| `npm run deploy` | Publica el Worker (`wrangler deploy`) |
| `npm run db:generate` | Genera migraciones desde el esquema Drizzle |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:seed` | Carga datos de ejemplo |
| `npm run test` | Vitest sobre los módulos |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Despliegue

```bash
# Secretos en producción (una sola vez por cada uno)
wrangler secret put DATABASE_URL
wrangler secret put AUTH_SECRET
wrangler secret put OPENAI_API_KEY

# Publicar
npm run deploy
```

Los **Cron Triggers** y los *bindings* (R2, Hyperdrive, Queues) se declaran en
`wrangler.toml`. El dominio `api.dominio.mx` se enruta al Worker desde el panel de Cloudflare.
Como está dentro de un monorepo, ejecuta estos comandos **desde `.`**, o usa
`npm run build:backend` desde la raíz.

---

## Variables de entorno

El archivo `.dev.vars` lo comparte el equipo aparte (no está en el repo).

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena del pooler de Supabase (puerto 6543, `sslmode=require`) |
| `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` | Misma base, para el binding HYPERDRIVE en `wrangler dev` |
| `SUPABASE_URL` / `SUPABASE_JWKS_URL` | Proyecto de Supabase; el Worker verifica el JWT contra el JWKS |
| `IDENTITY_PEPPER` | Llave del HMAC de las matrículas (nunca se guarda en la BD) |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (URL del frontend) |
| `INSTITUTIONAL_EMAIL_DOMAIN` | Dominio de correo aceptado (`uthh.edu.mx`) |
| `SUPABASE_SECRET_KEY` | Solo si el Worker administra usuarios (opcional) |
| `CLOUDINARY_*` | Imágenes del sistema (opcional) |
| `OPENAI_API_KEY` | Moderación automática por IA (opcional; API gratuita) |

---

## ADRs (Architectural Decision Records)

Cada decisión de arquitectura se registra en `docs/adr/` con su contexto, la decisión y sus
consecuencias:

1. **0001** — Monolito modular en lugar de microservicios.
2. **0002** — Runtime Cloudflare Workers (y por qué no Express/Node como el repo de referencia).
3. **0003** — PostgreSQL en Supabase usado solo como base de datos.
4. **0004** — Eventos de integración: outbox en Postgres vs. Cloudflare Queues.

---

## Hoja de ruta

- [x] **MVP** — Esqueleto del monolito modular + módulo `identidad`: alta con enlace de un solo
      uso por correo institucional (magic link, vía Resend), dos roles, cuenta «Sociedad
      Estudiantil».
- [x] **MVP** — `muro` + `contenido`: generador con plantillas, publicación anónima opcional,
      swiper, foro con scroll infinito, ranking, filtros, avisos/eventos/propuestas.
- [ ] **Fase 2** — `moderacion`: filtro local + API gratuita + reporte comunitario con auto-ocultado.
- [ ] **Fase 3** — `denuncias` (reportes de irregularidades) con evidencia y validación
      comunitaria (requiere revisión previa manual).
- [ ] **Sin fecha / opcional** — `asambleas` (convocatorias, orden del día, minutas): sin
      módulo de backend todavía, la pantalla del frontend existe como cascarón.

*Fuera de alcance por decisión del equipo:* tablero visual de firmas y exportación a PDF — no
encajan con el enfoque de asociación estudiantil (participación, no reporte de datos).

---

## Convenciones de código

- Un módulo **no importa** de otro módulo directamente: solo se comunican por eventos de
  integración o por su API HTTP.
- En los módulos Clean, la regla de dependencia es estricta: `domain` no conoce a nadie;
  `application` solo a `domain`; `infrastructure` implementa puertos de `application`.
- Toda entrada HTTP se valida con Zod antes de llegar a un servicio.
- Toda escritura que dispare un evento lo hace en la **misma transacción** que el cambio.
- Nombres de dominio y de tablas en español; código y tipos en inglés donde sea idiomático.

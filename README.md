# El Aula Informa · Comunidad UTHH

Plataforma de participación y auditoría estudiantil de la Universidad
Tecnológica de la Huasteca Hidalguense.

Este repositorio contiene **tres aplicaciones independientes**:

| Carpeta | Qué es | Dónde se despliega |
|---|---|---|
| [`student-community-platform-api/`](student-community-platform-api/) | Backend — Hono (monolito modular) | Cloudflare Workers |
| [`student-community-platform-web/`](student-community-platform-web/) | Frontend — Next.js (App Router) | Vercel |
| [`moderacion-ml/`](moderacion-ml/) | Modelo propio de moderación — Python (FastAPI) | Hugging Face Spaces |

La base de datos (PostgreSQL) vive en Supabase y la administra el SQL de
`student-community-platform-api/db/`.

## Puesta en marcha local

Los archivos de variables de entorno **no están en el repo** (tienen
secretos). Pídelos a quien administra los secretos del equipo:

- `student-community-platform-api/.dev.vars` (backend)
- `student-community-platform-web/.env.local` (frontend)

```bash
# Terminal 1 — backend
cd student-community-platform-api
npm install
# copiar aquí el archivo .dev.vars que te pasó el equipo
npm run dev                            # http://localhost:8787

# Terminal 2 — frontend
cd student-community-platform-web
npm install
# copiar aquí el archivo .env.local que te pasó el equipo
npm run dev                            # http://localhost:3000
```

Cada carpeta tiene su propio README con el detalle.

## Acceso

Inicio de sesión con **Google** (correo institucional `@uthh.edu.mx`); el
código por correo queda como respaldo. El filtro de dominio lo hace un
trigger en la base de datos.

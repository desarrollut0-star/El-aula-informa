# El Aula Informa · Comunidad UTHH

Plataforma de participación y auditoría estudiantil de la Universidad
Tecnológica de la Huasteca Hidalguense.

Este repositorio contiene **dos aplicaciones independientes**:

| Carpeta | Qué es | Dónde se despliega |
|---|---|---|
| [`student-community-platform-api/`](student-community-platform-api/) | Backend — Hono (monolito modular) | Cloudflare Workers |
| [`student-community-platform-web/`](student-community-platform-web/) | Frontend — Next.js (App Router) | Vercel |

La base de datos (PostgreSQL) vive en Supabase y la administra el SQL de
`student-community-platform-api/db/`.

## Puesta en marcha local

```bash
# Terminal 1 — backend
cd student-community-platform-api
npm install
cp .dev.vars.example .dev.vars        # rellenar secretos
npm run dev                            # http://localhost:8787

# Terminal 2 — frontend
cd student-community-platform-web
npm install
cp .env.local.example .env.local      # rellenar la publishable key de Supabase
npm run dev                            # http://localhost:3000
```

Cada carpeta tiene su propio README con el detalle.

## Acceso

Inicio de sesión con **Google** (correo institucional `@uthh.edu.mx`); el
código por correo queda como respaldo. El filtro de dominio lo hace un
trigger en la base de datos.

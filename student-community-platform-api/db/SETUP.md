# Estado y puesta en marcha

Detalle completo: `INSTRUCCIONES.txt` (v2.0) y sección 14 del reporte.

## Estado (6 sep 2026)

| Pieza | Estado |
|---|---|
| **Base de datos** | ✅ **Instalada y corriendo** en Supabase (`rpfrexmdoigwxnstffun`, plan gratuito). 29 tablas, 3 vistas, RLS, parches 04 + 05 aplicados. |
| **Backend (Worker)** | ⬜ No desplegado. Faltan los secretos de Pedro. |
| **Frontend (Vercel)** | ⬜ No desplegado. Falta el Site URL en Auth cuando exista. |

Proyecto: `desarrollut.0@gmail.com's Project` · Región East US · Ref `rpfrexmdoigwxnstffun`

Decisiones ya tomadas: Supabase Auth (no propia) · Cloudinary (no R2) · Data API desactivada.

## Secretos que faltan (los da Pedro)

| Secreto | Va en | ¿Llegó? |
|---|---|---|
| `DATABASE_URL` (contraseña de `app_backend`) | `.dev.vars` + `wrangler secret` | [ ] |
| `IDENTITY_PEPPER` | `.dev.vars` + `wrangler secret` | [ ] |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_…`) | `apps/frontend/.env.local` | [ ] |
| Llaves de Cloudinary | cuando alguien cree la cuenta | [ ] |

`SUPABASE_URL` y `SUPABASE_JWKS_URL` ya están en `wrangler.toml` (no son secretos).

## Comprobar la conexión antes de programar

```bash
psql "postgresql://app_backend.rpfrexmdoigwxnstffun:<PASS>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" \
  -c "select current_user;" -c "select count(*) from programas;"
# Debe responder: app_backend  y  21
```

Si el pooler rechaza `app_backend`, plan B: usar el rol `postgres` con la misma cadena y avisar a Pedro (no debilita RLS).

## Pendientes del equipo

- [ ] Validar nombres de programas y a qué carrera continúa cada TSU
- [ ] Cargar `matricula_total` por programa (hoy en 0)
- [ ] Site URL en Auth cuando exista el deploy en Vercel
- [ ] Decidir inicio de sesión con Google (correo institucional es Google Workspace)
- [ ] Programar respaldo semanal (`pg_dump` con GitHub Action)
- [ ] Crear cuenta de Cloudinary
- [ ] Redactar el aviso de privacidad definitivo (`/privacidad` es borrador)

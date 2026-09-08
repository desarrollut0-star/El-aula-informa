# 0003 — Supabase: PostgreSQL + Auth + Storage (para lo sensible)

## Estado
Aceptado — reemplaza la versión previa "Supabase solo como base de datos".

## Contexto
El modelo de datos v1.2 (diagrama ER) asume Supabase Auth (`auth.users`,
`usuarios.id = auth.users.id`). Mantener además un login hecho a mano
significaba dos sistemas de autenticación compitiendo — mala práctica.

## Decisión
Se usa Supabase para tres cosas:

1. **PostgreSQL** — la base, con esquemas `public` y `privado` (este último
   para `identidades`, `padron_alumnos`, `cargas_padron`). El esquema `auth`
   lo administra Supabase; drizzle-kit lo excluye (`schemaFilter`).
2. **Supabase Auth** — identidad y sesiones. El frontend hace
   `signInWithOtp` con el correo institucional; el backend valida el JWT
   (firma HS256 con `SUPABASE_JWT_SECRET`) en el middleware de Hono y
   busca el perfil en `usuarios`. Se elimina el código de sesión propio
   (`sesiones`, `tokens_acceso`, `SesionesRepository`).
3. **Supabase Storage** — SOLO la evidencia de denuncias (bucket privado,
   RLS atada a Supabase Auth). Es dato sensible y se queda dentro del
   perímetro de Supabase, no repartido a otro servicio.

Las imágenes NO sensibles del sistema (portadas de contenido, fotos de
carreras) van en **Cloudinary** — ver ADR 0002.

## Consecuencias
- El backend en Workers valida el JWT localmente con `jose` (sin llamada de
  red por petición).
- La restricción "solo `@uthh.edu.mx`" se aplica en el frontend antes de
  `signInWithOtp` y conviene reforzarla con una política/trigger en Supabase.
- Un trigger en Supabase crea la fila en `usuarios` (con alias aleatorio)
  cuando se registra un `auth.users`.
- La conexión Workers → Supabase usa el pooler (puerto 6543).

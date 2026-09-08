# 0006 — Base de datos: `db/comunidad_uthh.sql` es la fuente de verdad

## Estado
Aceptado

## Contexto
El scaffold generaba el esquema con `drizzle-kit`. El equipo de base de
datos (Pedro Rubio Angeles) entregó `comunidad_uthh.sql` v1.2: script
completo y probado (30 tablas, 3 vistas, ~20 funciones, ~25 triggers, RLS,
semilla, 40 pruebas) para correr en Supabase.

## Decisión

1. **`apps/backend/db/comunidad_uthh.sql` es el esquema de record.** Se
   ejecuta en Supabase → SQL Editor. Cualquier cambio se hace primero ahí,
   se prueba con `db/pruebas_comunidad_uthh.sql` en un proyecto de pruebas,
   y luego se aplica en producción.
2. **Drizzle queda solo como espejo tipado** (`src/**/schema.ts`): declara
   las formas para el query builder y TypeScript. **No se generan
   migraciones** — se quitó `drizzle-kit generate/migrate` de los scripts.
   Los `schema.ts` se editan a mano para seguir al SQL.
3. **Los contadores los mantienen triggers**, no el backend
   (`total_apoyos`, `total_rechazos`, `total_reportes`, `total_comentarios`,
   `total_confirmaciones`, `total_votos`, `total_usos`). El backend solo los
   LEE.
4. **El feed y el swiper leen de `vista_muro`** (resuelve el anonimato en
   SQL). La cola del equipo lee de `vista_cola_moderacion`. Las firmas por
   programa, de `vista_estadisticas_programa`.
5. **El ranking es `recalcular_ranking()`** en la base; el cron solo la
   llama. Igual con `purgar_antiguos()` y `archivos_huerfanos()`.
6. **Supabase Auth (variante A):** tres triggers sobre `auth.users`
   (validar dominio, crear perfil con alias aleatorio, sincronizar
   confirmación). El Worker valida el JWT contra el JWKS del proyecto.
7. **Rol de conexión `app_backend`** (mínimo privilegio); RLS activa en
   todas las tablas.
8. **Evidencia de denuncias en Cloudinary** (`uso='evidencia'`,
   `entrega='private'`, URL con vencimiento) — como lo armó Pedro. Se
   descartó Supabase Storage para no divergir del SQL probado.

## Consecuencias
- Un solo lugar donde vive el esquema, con pruebas.
- El backend es más delgado (sin lógica de contadores ni de ranking).
- Falta implementar endpoints de: comentarios, encuestas, asambleas,
  apelaciones, réplicas, archivos (firma de Cloudinary). La base ya los
  soporta.

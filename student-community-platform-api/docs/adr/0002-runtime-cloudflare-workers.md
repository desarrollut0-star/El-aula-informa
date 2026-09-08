# 0002 — Runtime: Cloudflare Workers (no Node/Express como el repo de referencia)

## Estado
Aceptado

## Contexto
El ADR 0001 adopta el patrón de `mgce/modular-monolith-nodejs`, que corre
sobre Node.js con Express, Awilix (DI) y MikroORM. El equipo decidió,
independientemente, alojar el backend en **Cloudflare Workers** por su
capa gratuita generosa, su CDN global integrada y por no tener que
administrar un servidor Node siempre encendido.

Cloudflare Workers **no es un runtime Node estándar**: es un entorno de
*isolates* de V8 con límites de CPU por petición y sin proceso persistente.
Express no corre bien ahí; Awilix y MikroORM no son compatibles.

## Decisión
Se conserva el **patrón** del repo de referencia (módulos aislados +
eventos de integración + ADRs) pero se sustituyen las librerías atadas a
Node:

| Repo de referencia | Este proyecto |
|---|---|
| Express | **Hono** (framework HTTP para Workers) |
| Awilix (DI) | Composición manual simple por módulo |
| MikroORM | **Drizzle ORM** (compatible con Workers) |
| Redis | Patrón *outbox* en PostgreSQL (o Cloudflare Queues) |
| Docker / proceso Node | Cloudflare Workers + Cron Triggers |
| Cloudflare R2 (archivos) | **Cloudinary** para imágenes del sistema (portadas, fotos de carreras) y **Supabase Storage** (bucket privado) para la evidencia de denuncias |

## Consecuencias

- Se pierde parte del valor de "seguir el repo al pie de la letra"; se
  documenta aquí para que quede explícito en cualquier evaluación
  académica del proyecto.
- Se gana: sin servidores que administrar, escalado automático, CDN
  integrada, capa gratuita amplia.
- Limitación a vigilar: procesos largos (p. ej. generar PDF con un
  navegador embebido) no corren bien en Workers; requieren la API Browser
  Rendering de Cloudflare o un servicio aparte pequeño.

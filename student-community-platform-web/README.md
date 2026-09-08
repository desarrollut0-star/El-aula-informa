# student-community-platform-web

Frontend de **El Aula Informa · Comunidad UTHH**. Next.js (App Router),
para desplegarse en **Vercel**. Consume la API del backend
(`student-community-platform-api`, Hono en Cloudflare Workers) por HTTP.
El login lo hace Supabase Auth; los datos siempre se piden al backend
(la Data API de Supabase está desactivada).

## Estructura

```
app/
├── layout.tsx  page.tsx            # portada: accesos rápidos + muro
├── muro/  muro/nuevo               # foro con scroll infinito + publicar
├── swiper/                          # vista de celular (reaccionar deslizando)
├── avisos/  eventos/  propuestas/  encuestas/   # feed filtrado por tipo
├── denuncias/  denuncias/nueva/     # reportes de irregularidades
├── acceso/  completar-perfil/       # login OTP + onboarding (programa + términos)
├── yo/  mis-publicaciones/  notificaciones/
├── contenido/[id]/  asambleas/[id]/  moderacion/  buscar/   # cascarones
├── nosotros/  codigo-de-conducta/  preguntas-frecuentes/
└── terminos/  privacidad/           # se aceptan en el primer acceso
components/   layout · contenido · inicio · ui
lib/          api-client.ts · supabase.ts · tipos.ts · config.ts
```

## Variables de entorno

Copiar `.env.local.example` a `.env.local`:

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rpfrexmdoigwxnstffun.supabase.co` (ya en el .example) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable (`sb_publishable_…`) |
| `NEXT_PUBLIC_API_URL` | local: `http://localhost:8787` · prod: `https://api.dominio.mx` |

## Local

```bash
npm install
cp .env.local.example .env.local     # rellenar la publishable key
npm run dev                           # http://localhost:3000
```

El backend corre aparte (ver su repo). Si no está levantado, las páginas
no truenan: cada petición está envuelta en `.catch()` y cae a datos vacíos.

## Despliegue (Vercel)

- Importar este repo en Vercel (ya no es monorepo: el frontend es la raíz).
- Cargar las 3 variables `NEXT_PUBLIC_*` en Settings → Environment Variables.
- En Supabase → Authentication → URL Configuration: poner la URL de Vercel
  como Site URL y en Redirect URLs.
- Front y back bajo el mismo dominio con subdominios (`dominio.mx` /
  `api.dominio.mx`).

## Pendiente

- Votar en encuestas, hilos de comentarios, detalle de contenido, panel de
  moderación, búsqueda — hoy son cascarones (el backend ya soporta la base).
- Subida de imágenes/evidencia a Cloudinary (falta la cuenta y el endpoint de firma).

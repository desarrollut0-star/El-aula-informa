import { cors } from "hono/cors";
import type { Bindings } from "../../env";

/**
 * Restringe la API al origen del frontend y permite el envío de la cookie
 * de sesión. Front y back viven bajo el mismo dominio con subdominios
 * (dominio.mx / api.dominio.mx), así que la cookie puede ser SameSite=Lax.
 */
export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const permitido = (c.env as Bindings).FRONTEND_ORIGIN;
      return origin === permitido ? origin : permitido;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
}

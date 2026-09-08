import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { requireRole } from "../../../shared/auth/middleware";
import { AppError } from "../../../shared/http/error";
import { NotificacionesService } from "../core/notificaciones.service";

export const notificacionesRoutes = new Hono<AppEnv>();

notificacionesRoutes.get("/", requireRole(), async (c) => {
  const session = c.get("session");
  if (!session) throw new AppError(401, "SIN_SESION", "Inicia sesión.");
  const lista = await new NotificacionesService(c.get("db")).listar(session.usuarioId);
  return c.json({ notificaciones: lista });
});

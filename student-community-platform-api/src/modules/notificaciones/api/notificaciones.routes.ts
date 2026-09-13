import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { requireSesion } from "../../../shared/auth/middleware";
import { AppError } from "../../../shared/http/error";
import { NotificacionesService } from "../core/notificaciones.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const notificacionesRoutes = new Hono<AppEnv>();

/**
 * Leer las propias notificaciones solo exige sesión, no rol verificado: una
 * cuenta que pasó a solo lectura tiene que poder ver el aviso que se lo
 * explica (evento AlumnoDadoDeBaja).
 */
notificacionesRoutes.use("*", requireSesion());

function usuarioDe(session: AppEnv["Variables"]["session"]): string {
  if (!session) throw new AppError(401, "SIN_SESION", "Inicia sesión.");
  return session.usuarioId;
}

notificacionesRoutes.get("/", async (c) => {
  const lista = await new NotificacionesService(c.get("db")).listar(usuarioDe(c.get("session")));
  return c.json({ notificaciones: lista });
});

/** Solo el número: lo consulta la campana del header cada minuto. */
notificacionesRoutes.get("/no-leidas", async (c) => {
  const total = await new NotificacionesService(c.get("db")).noLeidas(usuarioDe(c.get("session")));
  return c.json({ total });
});

notificacionesRoutes.post("/leer-todas", async (c) => {
  const marcadas = await new NotificacionesService(c.get("db")).marcarTodas(usuarioDe(c.get("session")));
  return c.json({ marcadas });
});

notificacionesRoutes.post("/:id/leer", async (c) => {
  const id = c.req.param("id");
  if (!UUID.test(id)) throw new AppError(400, "ID_INVALIDO", "Notificación no válida.");
  await new NotificacionesService(c.get("db")).marcarLeida(usuarioDe(c.get("session")), id);
  return c.json({ ok: true });
});

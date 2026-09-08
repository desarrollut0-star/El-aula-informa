import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../../env";
import { requireRole } from "../../../shared/auth/middleware";
import { validarJson } from "../../../shared/http/validate";
import { ModeracionService } from "../core/moderacion.service";

export const moderacionRoutes = new Hono<AppEnv>();

const reportarSchema = z.object({
  objetivo: z.enum(["contenido", "comentario"]),
  objetivoId: z.string().uuid(),
  motivo: z.enum(["spam", "ofensivo", "datos_personales", "informacion_falsa", "otro"]),
  detalle: z.string().max(280).optional(),
});

/** Botón «reportar» en cualquier tarjeta o comentario del muro. */
moderacionRoutes.post("/reportar", requireRole(), validarJson(reportarSchema), async (c) => {
  const session = c.get("session")!;
  const { objetivo, objetivoId, motivo, detalle } = c.req.valid("json");
  const resultado = await new ModeracionService(c.get("db")).reportar(
    objetivo,
    objetivoId,
    session.usuarioId,
    motivo,
    detalle,
  );
  return c.json(resultado);
});

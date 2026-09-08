import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../../env";
import { requireRole } from "../../../shared/auth/middleware";
import { validarJson } from "../../../shared/http/validate";
import { FirmasService } from "../core/firmas.service";

export const firmasRoutes = new Hono<AppEnv>();

const firmarSchema = z.object({ programaId: z.string().uuid() });

firmasRoutes.post("/", requireRole(), validarJson(firmarSchema), async (c) => {
  const session = c.get("session")!;
  const resultado = await new FirmasService(c.get("db")).firmar(session.usuarioId, c.req.valid("json").programaId);
  return c.json(resultado, 201);
});

firmasRoutes.get("/mi-firma", requireRole(), async (c) => {
  const session = c.get("session")!;
  const firmado = await new FirmasService(c.get("db")).yaFirmo(session.usuarioId);
  return c.json({ firmado });
});

/** Conteo total (sin desglose por programa — no hay tablero). */
firmasRoutes.get("/total", async (c) => {
  return c.json({ total: await new FirmasService(c.get("db")).total() });
});

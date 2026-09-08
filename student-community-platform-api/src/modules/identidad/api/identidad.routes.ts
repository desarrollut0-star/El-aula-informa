import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../../env";
import { validarJson } from "../../../shared/http/validate";
import { AppError } from "../../../shared/http/error";
import { UsuariosRepository } from "../infrastructure/usuarios.repository";
import { programas } from "../schema";
import { VERSION_TERMINOS } from "../domain/terminos";

export const identidadRoutes = new Hono<AppEnv>();

/**
 * Alta / login lo hace Supabase Auth desde el frontend (signInWithOtp +
 * verifyOtp con el código de 8 dígitos). Aquí: perfil, completar perfil y
 * aceptación de términos.
 */

/** Sesión actual: alias, rol, cuenta oficial y si ya aceptó los términos. */
identidadRoutes.get("/yo", (c) => {
  const session = c.get("session");
  if (!session) return c.json({ session: null, versionTerminos: VERSION_TERMINOS });
  return c.json({ session, versionTerminos: VERSION_TERMINOS });
});

/** Catálogo de programas para el selector del primer acceso. */
identidadRoutes.get("/programas", async (c) => {
  const filas = await c.get("db").select({ id: programas.id, nombre: programas.nombre }).from(programas);
  return c.json({ programas: filas });
});

const perfilSchema = z.object({ programaId: z.string().uuid() });

identidadRoutes.post("/completar-perfil", validarJson(perfilSchema), async (c) => {
  const session = c.get("session");
  if (!session) throw new AppError(401, "SIN_SESION", "Inicia sesión.");
  await new UsuariosRepository(c.get("db")).completarPerfil(session.usuarioId, c.req.valid("json").programaId);
  return c.json({ ok: true });
});

const terminosSchema = z.object({ version: z.string() });

/** Guarda en la BD que el alumno aceptó los términos y el aviso de privacidad. */
identidadRoutes.post("/aceptar-terminos", validarJson(terminosSchema), async (c) => {
  const session = c.get("session");
  if (!session) throw new AppError(401, "SIN_SESION", "Inicia sesión.");
  if (c.req.valid("json").version !== VERSION_TERMINOS) {
    throw new AppError(409, "VERSION_DESACTUALIZADA", "Los términos cambiaron. Recarga la página.");
  }
  await new UsuariosRepository(c.get("db")).aceptarTerminos(session.usuarioId, VERSION_TERMINOS);
  return c.json({ ok: true });
});

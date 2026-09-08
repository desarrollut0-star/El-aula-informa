import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../env";
import { Rol } from "../../modules/identidad/domain/rol";
import { AppError } from "../http/error";

/**
 * Exige que la petición traiga una sesión válida y, opcionalmente, un rol
 * mínimo. Esta es la barrera real de autorización: la pantalla del
 * frontend puede ocultar botones, pero es este middleware el que hace que
 * un usuario `no_verificado` (o dado de baja) reciba 401/403 al intentar
 * escribir.
 */
/**
 * Exige solo que haya sesión (cualquier rol). Para lo que un visitante
 * sin cuenta no debe ver: el muro, los avisos, los reportes. Una cuenta
 * dada de baja (`no_verificado`) sí pasa: tiene lectura, no escritura.
 */
export function requireSesion() {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (!c.get("session")) {
      throw new AppError(401, "SIN_SESION", "Inicia sesión con tu correo institucional para ver esto.");
    }
    await next();
  });
}

export function requireRole(rolMinimo: Rol = Rol.Verificado) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get("session");
    if (!session) {
      throw new AppError(401, "SIN_SESION", "Inicia sesión con tu correo institucional.");
    }
    if (rolMinimo === Rol.Verificado && session.rol !== Rol.Verificado) {
      throw new AppError(
        403,
        "NO_VERIFICADO",
        "Tu cuenta no puede interactuar. Si diste de baja o eres egresado, solo tienes lectura.",
      );
    }
    // Ninguna acción de escritura sin haber aceptado los términos (queda
    // registrado en la BD: usuarios.acepto_terminos_en / version_terminos).
    if (rolMinimo === Rol.Verificado && !session.aceptoTerminos) {
      throw new AppError(403, "TERMINOS_PENDIENTES", "Acepta los términos de uso para poder publicar.");
    }
    await next();
  });
}

/** Exige que la sesión sea la cuenta compartida «Sociedad Estudiantil». */
export function requireCuentaOficial() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get("session");
    if (!session?.esCuentaOficial) {
      throw new AppError(403, "SOLO_CUENTA_OFICIAL", "Esta acción solo la puede publicar la cuenta Sociedad Estudiantil.");
    }
    await next();
  });
}

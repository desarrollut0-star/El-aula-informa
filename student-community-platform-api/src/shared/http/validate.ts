import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { AppError } from "./error";

/**
 * Envoltorio sobre @hono/zod-validator que devuelve nuestro AppError con
 * forma consistente en vez del error crudo de Zod.
 */
export function validarJson<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result) => {
    if (!result.success) {
      throw new AppError(400, "DATOS_INVALIDOS", result.error.issues[0]?.message ?? "Datos inválidos.");
    }
  });
}

export function validarQuery<T extends ZodSchema>(schema: T) {
  return zValidator("query", schema, (result) => {
    if (!result.success) {
      throw new AppError(400, "PARAMETROS_INVALIDOS", result.error.issues[0]?.message ?? "Parámetros inválidos.");
    }
  });
}

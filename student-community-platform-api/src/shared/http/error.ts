import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Error de aplicación con código estable para el frontend y mensaje legible. */
export class AppError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly codigo: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Handler global de errores para `app.onError(...)` en src/index.ts. */
export function manejarError(err: unknown, c: Context) {
  if (err instanceof AppError) {
    return c.json({ error: { codigo: err.codigo, mensaje: err.message } }, err.status);
  }

  console.error(err);
  return c.json(
    { error: { codigo: "ERROR_INTERNO", mensaje: "Algo salió mal. Intenta de nuevo." } },
    500,
  );
}

import { sql } from "drizzle-orm";
import type { Db } from "../../shared/db/client";

/** Cron diario: eventos procesados > 30 días y notificaciones leídas > 90 días. */
export async function purgarAntiguos(db: Db) {
  await db.execute(sql`select purgar_antiguos()`);
}

/**
 * Cron semanal: devuelve los archivos huérfanos. El Worker debe borrarlos
 * en Cloudinary y luego `delete from archivos where id = any($ids)`.
 */
export async function archivosHuerfanos(db: Db) {
  const filas = await db.execute<{ id: string; public_id: string; recurso: string; entrega: string; bytes: number }>(
    sql`select * from archivos_huerfanos()`,
  );
  // TODO: borrar cada public_id en Cloudinary y luego eliminar la fila.
  return filas;
}

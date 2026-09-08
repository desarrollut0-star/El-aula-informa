import { desc, eq } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { notificaciones } from "../schema";

export class NotificacionesService {
  constructor(private readonly db: Db) {}

  async crear(usuarioId: string, tipo: string, mensaje: string, contenidoId?: string) {
    await this.db.insert(notificaciones).values({ usuarioId, tipo, mensaje, contenidoId: contenidoId ?? null });
  }

  async listar(usuarioId: string) {
    return this.db
      .select()
      .from(notificaciones)
      .where(eq(notificaciones.usuarioId, usuarioId))
      .orderBy(desc(notificaciones.creadoEn))
      .limit(50);
  }
}

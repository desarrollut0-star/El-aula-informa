import { and, count, desc, eq, isNull } from "drizzle-orm";
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

  /** Cuenta las no leídas. Usa el índice parcial notificaciones_no_leidas_idx. */
  async noLeidas(usuarioId: string): Promise<number> {
    const [fila] = await this.db
      .select({ total: count() })
      .from(notificaciones)
      .where(and(eq(notificaciones.usuarioId, usuarioId), isNull(notificaciones.leidaEn)));
    return fila?.total ?? 0;
  }

  /**
   * Marca una como leída. Solo afecta si la notificación es del usuario, así
   * nadie puede marcar las de otra persona. Es idempotente.
   */
  async marcarLeida(usuarioId: string, id: string): Promise<number> {
    const filas = await this.db
      .update(notificaciones)
      .set({ leidaEn: new Date() })
      .where(
        and(eq(notificaciones.id, id), eq(notificaciones.usuarioId, usuarioId), isNull(notificaciones.leidaEn)),
      )
      .returning({ id: notificaciones.id });
    return filas.length;
  }

  async marcarTodas(usuarioId: string): Promise<number> {
    const filas = await this.db
      .update(notificaciones)
      .set({ leidaEn: new Date() })
      .where(and(eq(notificaciones.usuarioId, usuarioId), isNull(notificaciones.leidaEn)))
      .returning({ id: notificaciones.id });
    return filas.length;
  }
}

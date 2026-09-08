import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { firmasApoyo } from "../schema";
import { publish } from "../../../shared/events/bus";
import { AppError } from "../../../shared/http/error";

/**
 * Firma de respaldo: conteo simple, una por usuario. Sin tablero visual ni
 * exportación a PDF (fuera de alcance por decisión del equipo).
 */
export class FirmasService {
  constructor(private readonly db: Db) {}

  async firmar(usuarioId: string, programaId: string) {
    const filas = await this.db
      .insert(firmasApoyo)
      .values({ usuarioId, programaId })
      .onConflictDoNothing({ target: firmasApoyo.usuarioId })
      .returning();

    if (filas.length === 0) {
      throw new AppError(409, "YA_FIRMASTE", "Ya registraste tu firma de respaldo.");
    }
    await publish(this.db, { type: "FirmaRegistrada", payload: { usuarioId, programaId } });
    return { firmado: true };
  }

  async yaFirmo(usuarioId: string): Promise<boolean> {
    const [fila] = await this.db
      .select({ n: sql<number>`1` })
      .from(firmasApoyo)
      .where(eq(firmasApoyo.usuarioId, usuarioId))
      .limit(1);
    return Boolean(fila);
  }

  async total(): Promise<number> {
    const [fila] = await this.db.select({ total: sql<number>`count(*)::int` }).from(firmasApoyo);
    return fila?.total ?? 0;
  }
}

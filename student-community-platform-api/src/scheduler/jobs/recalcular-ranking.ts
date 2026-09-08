import { sql } from "drizzle-orm";
import type { Db } from "../../shared/db/client";

/**
 * El ranking del muro lo calcula la función `recalcular_ranking()` de la
 * base (misma fórmula que shared/ranking/score.ts). El cron solo la llama.
 */
export async function recalcularRanking(db: Db) {
  await db.execute(sql`select recalcular_ranking()`);
}

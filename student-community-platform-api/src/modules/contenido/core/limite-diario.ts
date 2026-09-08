import { and, eq, gt, sql } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { AppError } from "../../../shared/http/error";
import { contenidos } from "../schema";

/**
 * Cuántas publicaciones puede crear una cuenta normal en 24 h. Evita que
 * una cuenta sature el muro (y el servidor). Reacciones y comentarios NO
 * cuentan — solo publicaciones (testimonios, avisos, eventos, propuestas,
 * novedades y denuncias). La cuenta oficial está exenta.
 */
export const LIMITE_PUBLICACIONES_DIA = 3;

async function publicacionesUltimas24h(db: Db, autorId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contenidos)
    .where(and(eq(contenidos.autorId, autorId), gt(contenidos.creadoEn, sql`now() - interval '24 hours'`)));
  return n;
}

/** Para mostrar en los formularios cuántas publicaciones quedan hoy. */
export async function limiteDiario(db: Db, autorId: string, esCuentaOficial: boolean) {
  if (esCuentaOficial) return { usadas: 0, limite: null as number | null, restantes: null as number | null };
  const usadas = await publicacionesUltimas24h(db, autorId);
  return {
    usadas,
    limite: LIMITE_PUBLICACIONES_DIA,
    restantes: Math.max(0, LIMITE_PUBLICACIONES_DIA - usadas),
  };
}

export async function asegurarLimiteDiario(db: Db, autorId: string, esCuentaOficial: boolean): Promise<void> {
  if (esCuentaOficial) return;

  const n = await publicacionesUltimas24h(db, autorId);

  if (n >= LIMITE_PUBLICACIONES_DIA) {
    throw new AppError(
      429,
      "LIMITE_DIARIO",
      `Ya publicaste ${LIMITE_PUBLICACIONES_DIA} veces en las últimas 24 horas. Inténtalo más tarde.`,
    );
  }
}

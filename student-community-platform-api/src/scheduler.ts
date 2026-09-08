import type { Bindings } from "./env";
import { createDb } from "./shared/db/client";
import { procesarEventosPendientes } from "./shared/events/dispatcher";
import { modulos } from "./index";
import { reconciliarPadron } from "./scheduler/jobs/reconciliar-padron";
import { recalcularRanking } from "./scheduler/jobs/recalcular-ranking";
import { purgarAntiguos, archivosHuerfanos } from "./scheduler/jobs/purgar";

/**
 * Entrypoint del `scheduled()` del Worker. Cloudflare lo dispara en cada
 * Cron Trigger de wrangler.toml; no hay proceso siempre encendido.
 */
export async function procesarScheduled(controller: ScheduledController, env: Bindings) {
  const db = createDb(env);

  // El dispatcher del outbox corre en cada disparo (barato).
  await procesarEventosPendientes(db, env, modulos);

  switch (controller.cron) {
    case "*/15 * * * *":
      await recalcularRanking(db);
      break;
    case "0 4 * * *":
      await Promise.all([reconciliarPadron(db), purgarAntiguos(db)]);
      break;
    case "0 5 * * 1":
      await archivosHuerfanos(db);
      break;
  }
}

import { and, asc, eq, lte } from "drizzle-orm";
import { eventosIntegracion } from "../db/outbox.schema";
import type { Db } from "../db/client";
import type { Bindings } from "../../env";
import type { AppModule, ModuleContext } from "../../modules/module";
import type { IntegrationEventType } from "./types";

const LOTE = 25;
const MAX_INTENTOS = 5;
const BACKOFF_MIN = [1, 5, 15, 60, 240];

function construirRegistro(modules: AppModule[]) {
  const registro = new Map<IntegrationEventType, Array<(payload: unknown, ctx: ModuleContext) => Promise<void>>>();
  for (const modulo of modules) {
    if (!modulo.eventHandlers) continue;
    for (const [tipo, handler] of Object.entries(modulo.eventHandlers)) {
      if (!handler) continue;
      const lista = registro.get(tipo as IntegrationEventType) ?? [];
      lista.push(handler as (p: unknown, c: ModuleContext) => Promise<void>);
      registro.set(tipo as IntegrationEventType, lista);
    }
  }
  return registro;
}

/**
 * Procesa un lote de eventos `pendiente` cuyo turno ya llegó. Ante un
 * fallo suma `intentos` y agenda `siguiente_intento_en` (backoff); a los
 * MAX_INTENTOS el evento pasa a `fallido`.
 */
export async function procesarEventosPendientes(
  db: Db,
  env: Bindings,
  modules: AppModule[],
): Promise<{ procesados: number; fallidos: number }> {
  const registro = construirRegistro(modules);
  const ctx: ModuleContext = { db, env };

  const pendientes = await db
    .select()
    .from(eventosIntegracion)
    .where(and(eq(eventosIntegracion.estado, "pendiente"), lte(eventosIntegracion.siguienteIntentoEn, new Date())))
    .orderBy(asc(eventosIntegracion.creadoEn))
    .limit(LOTE);

  let procesados = 0;
  let fallidos = 0;

  for (const evento of pendientes) {
    const handlers = registro.get(evento.tipo as IntegrationEventType) ?? [];
    try {
      await Promise.all(handlers.map((h) => h(evento.payload, ctx)));
      await db
        .update(eventosIntegracion)
        .set({ estado: "procesado", procesadoEn: new Date() })
        .where(eq(eventosIntegracion.id, evento.id));
      procesados += 1;
    } catch (err) {
      fallidos += 1;
      const intentos = evento.intentos + 1;
      const esperaMin = BACKOFF_MIN[Math.min(intentos - 1, BACKOFF_MIN.length - 1)]!;
      await db
        .update(eventosIntegracion)
        .set({
          intentos,
          estado: intentos >= MAX_INTENTOS ? "fallido" : "pendiente",
          siguienteIntentoEn: new Date(Date.now() + esperaMin * 60_000),
          ultimoError: err instanceof Error ? err.message : String(err),
        })
        .where(eq(eventosIntegracion.id, evento.id));
    }
  }

  return { procesados, fallidos };
}

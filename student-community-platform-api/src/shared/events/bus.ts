import { eventosIntegracion } from "../db/outbox.schema";
import type { Db } from "../db/client";
import type { IntegrationEvent } from "./types";

/**
 * Publica un evento de integración escribiéndolo en la tabla outbox.
 * Debe llamarse dentro de la MISMA transacción que el cambio que lo origina
 * (pasar el `tx` de drizzle en vez de `db` cuando se publique desde un
 * `db.transaction(...)`), para que el evento nunca se pierda ni se
 * duplique respecto al dato que describe.
 */
export async function publish(db: Db, event: IntegrationEvent): Promise<void> {
  await db.insert(eventosIntegracion).values({
    tipo: event.type,
    payload: event.payload,
  });
}

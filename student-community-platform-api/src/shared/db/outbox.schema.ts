import { pgTable, uuid, text, jsonb, smallint, timestamp } from "drizzle-orm/pg-core";
import { estadoEventoIntegracion } from "./enums";

/**
 * Outbox de eventos entre módulos (lo crea el SQL de Pedro). El productor
 * inserta aquí en la misma transacción que el cambio; el dispatcher (Cron
 * Trigger) reparte los `pendiente` cuyo `siguiente_intento_en` ya llegó.
 */
export const eventosIntegracion = pgTable("eventos_integracion", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: text("tipo").notNull(),
  payload: jsonb("payload").notNull().default({}),
  estado: estadoEventoIntegracion("estado").notNull().default("pendiente"),
  intentos: smallint("intentos").notNull().default(0),
  siguienteIntentoEn: timestamp("siguiente_intento_en", { withTimezone: true }).notNull().defaultNow(),
  ultimoError: text("ultimo_error"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  procesadoEn: timestamp("procesado_en", { withTimezone: true }),
});

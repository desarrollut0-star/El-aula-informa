import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usuarios } from "../identidad/schema";
import { contenidos } from "../contenido/schema";

export const notificaciones = pgTable("notificaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  mensaje: text("mensaje").notNull(),
  contenidoId: uuid("contenido_id").references(() => contenidos.id, { onDelete: "cascade" }),
  leidaEn: timestamp("leida_en", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

import { pgTable, uuid, text, bigint, integer, smallint, timestamp } from "drizzle-orm/pg-core";
import { usuarios } from "../identidad/schema";
import { entregaArchivo, usoArchivo } from "../../shared/db/enums";

export { entregaArchivo, usoArchivo };

/**
 * Referencia y metadatos de cada archivo en Cloudinary (los bytes nunca se
 * guardan aquí). Cubre imágenes del sistema (portadas, fotos de carrera) Y
 * la evidencia de denuncias (uso='evidencia', entrega='private').
 */
export const archivos = pgTable("archivos", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  version: bigint("version", { mode: "number" }).notNull(),
  formato: text("formato").notNull(), // jpg png webp pdf
  recurso: text("recurso").notNull(), // image | raw
  entrega: entregaArchivo("entrega").notNull().default("upload"),
  bytes: integer("bytes").notNull(),
  ancho: smallint("ancho"),
  alto: smallint("alto"),
  huella: text("huella"),
  uso: usoArchivo("uso").notNull(),
  subidoPor: uuid("subido_por").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  eliminadoEn: timestamp("eliminado_en", { withTimezone: true }),
});

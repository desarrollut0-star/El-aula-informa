import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { contenidos, comentarios } from "../contenido/schema";
import { usuarios } from "../identidad/schema";
import { motivoReporte, accionModeracion, estadoContenido } from "../../shared/db/enums";

export { motivoReporte, accionModeracion };

/** Apunta a un `contenido` XOR un `comentario` (CHECK en el SQL). */
export const reportesContenido = pgTable("reportes_contenido", {
  id: uuid("id").primaryKey().defaultRandom(),
  contenidoId: uuid("contenido_id").references(() => contenidos.id, { onDelete: "cascade" }),
  comentarioId: uuid("comentario_id").references(() => comentarios.id, { onDelete: "cascade" }),
  reportadoPor: uuid("reportado_por")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  motivo: motivoReporte("motivo").notNull().default("otro"),
  detalle: text("detalle"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const accionesModeracion = pgTable("acciones_moderacion", {
  id: uuid("id").primaryKey().defaultRandom(),
  contenidoId: uuid("contenido_id").references(() => contenidos.id, { onDelete: "set null" }),
  comentarioId: uuid("comentario_id").references(() => comentarios.id, { onDelete: "set null" }),
  accion: accionModeracion("accion").notNull(),
  estadoAnterior: estadoContenido("estado_anterior"),
  estadoNuevo: estadoContenido("estado_nuevo"),
  razon: text("razon").notNull(),
  ejecutadoPorUsuarioId: uuid("ejecutado_por_usuario_id").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

/** Filtro local, editable desde Supabase sin desplegar. */
export const palabrasBloqueadas = pgTable("palabras_bloqueadas", {
  id: uuid("id").primaryKey().defaultRandom(),
  patron: text("patron").notNull(),
  esRegex: boolean("es_regex").notNull().default(false),
  motivo: text("motivo").notNull(),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

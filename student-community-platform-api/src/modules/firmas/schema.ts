import { pgTable, pgView, uuid, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usuarios, programas, nivelEducativo } from "../identidad/schema";

export const firmasApoyo = pgTable(
  "firmas_apoyo",
  {
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    programaId: uuid("programa_id")
      .notNull()
      .references(() => programas.id),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.usuarioId] }) }),
);

/** Firmas agrupadas por programa raíz (los TSU suman a su continuidad). La crea el SQL. */
export const vistaEstadisticasPrograma = pgView("vista_estadisticas_programa", {
  programaId: uuid("programa_id"),
  clave: text("clave"),
  nombre: text("nombre"),
  nivel: nivelEducativo("nivel"),
  matriculaTotal: integer("matricula_total"),
  totalFirmas: integer("total_firmas"),
  porcentaje: text("porcentaje"),
}).existing();

import {
  pgTable,
  pgView,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usuarios, programas } from "../identidad/schema";
import {
  tipoContenido,
  nivelImpacto,
  estadoContenido,
  modalidadAsamblea,
  estadoAsamblea,
} from "../../shared/db/enums";

export { tipoContenido, nivelImpacto, estadoContenido };

/**
 * Tabla central del muro. Contadores (`total_apoyos`, `total_rechazos`,
 * `total_comentarios`, `total_reportes`) los mantienen TRIGGERS — el
 * backend NUNCA los escribe. `score` lo calcula `recalcular_ranking()`.
 */
export const contenidos = pgTable("contenidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: tipoContenido("tipo").notNull(),
  autorId: uuid("autor_id")
    .notNull()
    .references(() => usuarios.id),
  programaId: uuid("programa_id").references(() => programas.id),
  esAnonimo: boolean("es_anonimo").notNull().default(false),
  titulo: text("titulo"),
  cuerpo: text("cuerpo").notNull(),
  nivel: nivelImpacto("nivel").notNull().default("medio"),
  estado: estadoContenido("estado").notNull().default("visible"),
  fijado: boolean("fijado").notNull().default(false),
  fechaEvento: timestamp("fecha_evento", { withTimezone: true }),
  lugar: text("lugar"),
  cierraEn: timestamp("cierra_en", { withTimezone: true }),
  score: integer("score").notNull().default(0),
  totalApoyos: integer("total_apoyos").notNull().default(0),
  totalRechazos: integer("total_rechazos").notNull().default(0),
  totalComentarios: integer("total_comentarios").notNull().default(0),
  totalReportes: integer("total_reportes").notNull().default(0),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
  editadoEn: timestamp("editado_en", { withTimezone: true }),
});

export const etiquetas = pgTable("etiquetas", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  fusionadaEnId: uuid("fusionada_en_id"),
  totalUsos: integer("total_usos").notNull().default(0),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const contenidoEtiquetas = pgTable(
  "contenido_etiquetas",
  {
    contenidoId: uuid("contenido_id")
      .notNull()
      .references(() => contenidos.id, { onDelete: "cascade" }),
    etiquetaId: uuid("etiqueta_id")
      .notNull()
      .references(() => etiquetas.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.contenidoId, t.etiquetaId] }) }),
);

export const reacciones = pgTable(
  "reacciones",
  {
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    contenidoId: uuid("contenido_id")
      .notNull()
      .references(() => contenidos.id, { onDelete: "cascade" }),
    aFavor: boolean("a_favor").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.usuarioId, t.contenidoId] }) }),
);

export const comentarios = pgTable("comentarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  contenidoId: uuid("contenido_id")
    .notNull()
    .references(() => contenidos.id, { onDelete: "cascade" }),
  autorId: uuid("autor_id")
    .notNull()
    .references(() => usuarios.id),
  padreId: uuid("padre_id"),
  cuerpo: text("cuerpo").notNull(),
  esRespuestaOficial: boolean("es_respuesta_oficial").notNull().default(false),
  estado: estadoContenido("estado").notNull().default("visible"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  editadoEn: timestamp("editado_en", { withTimezone: true }),
  eliminadoEn: timestamp("eliminado_en", { withTimezone: true }),
});

export const encuestaOpciones = pgTable("encuesta_opciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  contenidoId: uuid("contenido_id")
    .notNull()
    .references(() => contenidos.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  orden: smallint("orden").notNull(),
  totalVotos: integer("total_votos").notNull().default(0),
});

export const encuestaVotos = pgTable(
  "encuesta_votos",
  {
    contenidoId: uuid("contenido_id")
      .notNull()
      .references(() => contenidos.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    opcionId: uuid("opcion_id").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.contenidoId, t.usuarioId] }) }),
);

export const asambleas = pgTable("asambleas", {
  contenidoId: uuid("contenido_id")
    .primaryKey()
    .references(() => contenidos.id, { onDelete: "cascade" }),
  modalidad: modalidadAsamblea("modalidad").notNull().default("presencial"),
  ordenDelDia: text("orden_del_dia").notNull(),
  estado: estadoAsamblea("estado").notNull().default("convocada"),
  minuta: text("minuta"),
  minutaPublicadaEn: timestamp("minuta_publicada_en", { withTimezone: true }),
  asistentesEstimados: integer("asistentes_estimados"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const asambleaAcuerdos = pgTable("asamblea_acuerdos", {
  id: uuid("id").primaryKey().defaultRandom(),
  asambleaId: uuid("asamblea_id")
    .notNull()
    .references(() => asambleas.contenidoId, { onDelete: "cascade" }),
  orden: smallint("orden").notNull(),
  descripcion: text("descripcion").notNull(),
  responsable: text("responsable"),
  fechaCompromiso: date("fecha_compromiso"),
  cumplidoEn: timestamp("cumplido_en", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const contenidoAdjuntos = pgTable(
  "contenido_adjuntos",
  {
    contenidoId: uuid("contenido_id")
      .notNull()
      .references(() => contenidos.id, { onDelete: "cascade" }),
    archivoId: uuid("archivo_id").notNull(),
    orden: smallint("orden").notNull().default(1),
    pie: text("pie"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.contenidoId, t.archivoId] }) }),
);

// ---------- vistas (las crea el SQL de Pedro; aquí solo el tipo) ----------

/** Feed público. El anonimato ya viene resuelto (autor_alias null). */
export const vistaMuro = pgView("vista_muro", {
  id: uuid("id"),
  tipo: tipoContenido("tipo"),
  titulo: text("titulo"),
  cuerpo: text("cuerpo"),
  nivel: nivelImpacto("nivel"),
  fijado: boolean("fijado"),
  score: integer("score"),
  totalApoyos: integer("total_apoyos"),
  totalRechazos: integer("total_rechazos"),
  totalComentarios: integer("total_comentarios"),
  esAnonimo: boolean("es_anonimo"),
  autorAlias: text("autor_alias"),
  programaId: uuid("programa_id"),
  autorOficial: boolean("autor_oficial"),
  fechaEvento: timestamp("fecha_evento", { withTimezone: true }),
  lugar: text("lugar"),
  cierraEn: timestamp("cierra_en", { withTimezone: true }),
  encuestaCerrada: boolean("encuesta_cerrada"),
  noVerificada: boolean("no_verificada"),
  categoriaDenuncia: text("categoria_denuncia"),
  creadoEn: timestamp("creado_en", { withTimezone: true }),
}).existing();

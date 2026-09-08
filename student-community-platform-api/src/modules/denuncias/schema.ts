import { pgTable, uuid, text, integer, boolean, timestamp, date, smallint, primaryKey } from "drizzle-orm/pg-core";
import { contenidos } from "../contenido/schema";
import { usuarios } from "../identidad/schema";
import { estadoApelacion } from "../../shared/db/enums";

export { estadoApelacion };

export const categoriasDenuncia = pgTable("categorias_denuncia", {
  id: uuid("id").primaryKey().defaultRandom(),
  clave: text("clave").notNull().unique(),
  nombre: text("nombre").notNull(),
  activo: boolean("activo").notNull().default(true),
  orden: smallint("orden").notNull().default(0),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

/** Extensión de `contenidos` (tipo=denuncia). `total_confirmaciones` lo mantiene un trigger. */
export const denuncias = pgTable("denuncias", {
  contenidoId: uuid("contenido_id")
    .primaryKey()
    .references(() => contenidos.id, { onDelete: "cascade" }),
  categoriaId: uuid("categoria_id")
    .notNull()
    .references(() => categoriasDenuncia.id),
  ocurrioEn: date("ocurrio_en"),
  areaInvolucrada: text("area_involucrada"),
  noVerificada: boolean("no_verificada").notNull().default(true),
  totalConfirmaciones: integer("total_confirmaciones").notNull().default(0),
  revisadaPorUsuarioId: uuid("revisada_por_usuario_id").references(() => usuarios.id),
  revisadaEn: timestamp("revisada_en", { withTimezone: true }),
  motivoRechazo: text("motivo_rechazo"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

/** Evidencia = archivo de Cloudinary con uso='evidencia', entrega='private'. */
export const denunciaEvidencia = pgTable(
  "denuncia_evidencia",
  {
    denunciaId: uuid("denuncia_id")
      .notNull()
      .references(() => denuncias.contenidoId, { onDelete: "cascade" }),
    archivoId: uuid("archivo_id").notNull(),
    descripcion: text("descripcion"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.denunciaId, t.archivoId] }) }),
);

export const denunciaConfirmaciones = pgTable(
  "denuncia_confirmaciones",
  {
    denunciaId: uuid("denuncia_id")
      .notNull()
      .references(() => denuncias.contenidoId, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.denunciaId, t.usuarioId] }) }),
);

/** Derecho de réplica (lo publica la cuenta oficial). */
export const denunciaReplicas = pgTable("denuncia_replicas", {
  id: uuid("id").primaryKey().defaultRandom(),
  denunciaId: uuid("denuncia_id")
    .notNull()
    .references(() => denuncias.contenidoId, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  publicadaPorUsuarioId: uuid("publicada_por_usuario_id")
    .notNull()
    .references(() => usuarios.id),
  publicadaEn: timestamp("publicada_en", { withTimezone: true }).notNull().defaultNow(),
});

export const apelaciones = pgTable("apelaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  contenidoId: uuid("contenido_id")
    .notNull()
    .references(() => contenidos.id, { onDelete: "cascade" }),
  autorId: uuid("autor_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  estado: estadoApelacion("estado").notNull().default("pendiente"),
  resueltaPorUsuarioId: uuid("resuelta_por_usuario_id").references(() => usuarios.id),
  resolucion: text("resolucion"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  resueltaEn: timestamp("resuelta_en", { withTimezone: true }),
});

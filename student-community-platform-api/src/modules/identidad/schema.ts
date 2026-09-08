import { pgTable, uuid, text, integer, smallint, timestamp, boolean } from "drizzle-orm/pg-core";
import { privado, rolUsuario, nivelEducativo, estatusPadron } from "../../shared/db/enums";

export { rolUsuario, nivelEducativo, estatusPadron };

export const programas = pgTable("programas", {
  id: uuid("id").primaryKey().defaultRandom(),
  clave: text("clave").notNull().unique(),
  nombre: text("nombre").notNull(),
  nivel: nivelEducativo("nivel").notNull(),
  programaContinuidadId: uuid("programa_continuidad_id"),
  matriculaTotal: integer("matricula_total").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  orden: smallint("orden").notNull().default(0),
  imagenId: uuid("imagen_id"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Perfil público. `id` = `auth.users.id` (Supabase Auth). La fila la crea
 * el trigger `fn_auth_crear_usuario` con alias aleatorio.
 */
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey(),
  alias: text("alias").notNull().unique(),
  rol: rolUsuario("rol").notNull().default("no_verificado"),
  programaId: uuid("programa_id").references(() => programas.id),
  esCuentaOficial: boolean("es_cuenta_oficial").notNull().default(false),
  correoConfirmadoEn: timestamp("correo_confirmado_en", { withTimezone: true }),
  aceptoTerminosEn: timestamp("acepto_terminos_en", { withTimezone: true }),
  versionTerminos: text("version_terminos"),
  ultimoAccesoEn: timestamp("ultimo_acceso_en", { withTimezone: true }),
  eliminadoEn: timestamp("eliminado_en", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- esquema privado ----------

export const cargasPadron = privado.table("cargas_padron", {
  id: uuid("id").primaryKey().defaultRandom(),
  periodo: text("periodo").notNull(),
  totalRegistros: integer("total_registros").notNull().default(0),
  altas: integer("altas").notNull().default(0),
  bajas: integer("bajas").notNull().default(0),
  hashArchivo: text("hash_archivo"),
  cargadoPorUsuarioId: uuid("cargado_por_usuario_id").references(() => usuarios.id),
  cargadoEn: timestamp("cargado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const padronAlumnos = privado.table("padron_alumnos", {
  id: uuid("id").primaryKey().defaultRandom(),
  matriculaHmac: text("matricula_hmac").notNull().unique(),
  programaId: uuid("programa_id").references(() => programas.id),
  estatus: estatusPadron("estatus").notNull().default("activo"),
  ultimaCargaId: uuid("ultima_carga_id").references(() => cargasPadron.id),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const identidades = privado.table("identidades", {
  usuarioId: uuid("usuario_id")
    .primaryKey()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  padronId: uuid("padron_id").references(() => padronAlumnos.id),
  vinculadoPadronEn: timestamp("vinculado_padron_en", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

import { pgEnum, pgSchema } from "drizzle-orm/pg-core";

/**
 * ESPEJO TIPADO de la base. La base la crea y la administra
 * `apps/backend/db/comunidad_uthh.sql` (fuente de verdad, corre en Supabase).
 * Aquí solo declaramos las formas para que TypeScript y el query builder
 * las conozcan — NO se generan migraciones desde este código.
 *
 * Los valores de cada enum deben coincidir EXACTO con el SQL.
 */

/** Esquema privado: datos que identifican a una persona (padrón). */
export const privado = pgSchema("privado");

export const rolUsuario = pgEnum("rol_usuario", ["no_verificado", "verificado"]);
export const estatusPadron = pgEnum("estatus_padron", ["activo", "baja"]);
export const nivelEducativo = pgEnum("nivel_educativo", ["tsu", "ingenieria", "licenciatura"]);

export const tipoContenido = pgEnum("tipo_contenido", [
  "testimonio",
  "aviso",
  "evento",
  "novedad",
  "propuesta",
  "encuesta",
  "denuncia",
]);
export const estadoContenido = pgEnum("estado_contenido", ["visible", "en_revision", "oculto", "rechazado"]);
export const nivelImpacto = pgEnum("nivel_impacto", ["bajo", "medio", "alto"]);

export const motivoReporte = pgEnum("motivo_reporte", [
  "spam",
  "ofensivo",
  "datos_personales",
  "informacion_falsa",
  "otro",
]);
export const accionModeracion = pgEnum("accion_moderacion", [
  "ocultado_automatico",
  "ocultado_por_reportes",
  "ocultado_manual",
  "aprobado",
  "rechazado",
  "restaurado",
]);
export const estadoApelacion = pgEnum("estado_apelacion", ["pendiente", "aceptada", "rechazada"]);
export const estadoEventoIntegracion = pgEnum("estado_evento_integracion", ["pendiente", "procesado", "fallido"]);

export const modalidadAsamblea = pgEnum("modalidad_asamblea", ["presencial", "virtual", "mixta"]);
export const estadoAsamblea = pgEnum("estado_asamblea", ["convocada", "realizada", "cancelada"]);

export const usoArchivo = pgEnum("uso_archivo", ["portada_contenido", "foto_programa", "evidencia"]);
export const entregaArchivo = pgEnum("entrega_archivo", ["upload", "private"]);

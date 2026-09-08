/**
 * Barrel del espejo tipado. La base la crea `apps/backend/db/comunidad_uthh.sql`
 * (fuente de verdad). Aquí solo declaramos las formas para el query builder.
 */
export * from "./enums";
export * from "./outbox.schema";
export * from "../../modules/identidad/schema";
export * from "../../modules/contenido/schema";
export * from "../../modules/denuncias/schema";
export * from "../../modules/moderacion/schema";
export * from "../../modules/archivos/schema";
export * from "../../modules/firmas/schema";
export * from "../../modules/notificaciones/schema";

import { tipoContenido } from "../schema";

export type TipoContenido = (typeof tipoContenido.enumValues)[number];

/** Avisos y novedades solo los publica la cuenta «Sociedad Estudiantil». */
export const TIPOS_SOLO_CUENTA_OFICIAL: TipoContenido[] = ["aviso", "novedad"];

/** Estos tipos tienen su propio módulo/flujo, no se crean por el endpoint genérico. */
export const TIPOS_CON_FLUJO_PROPIO: TipoContenido[] = ["denuncia", "encuesta"];

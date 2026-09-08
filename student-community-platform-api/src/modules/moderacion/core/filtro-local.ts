import { eq } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { palabrasBloqueadas } from "../schema";

const REGEX_TELEFONO = /\b\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/;
const REGEX_RFC = /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/i;

export interface ResultadoFiltro {
  aprobado: boolean;
  motivo?: string;
}

/**
 * Primera capa de moderación (ER: tabla `palabras_bloqueadas`, moderable
 * sin desplegar). Bloquea lenguaje ofensivo y datos personales en claro.
 */
export async function filtrarTextoLocal(db: Db, texto: string): Promise<ResultadoFiltro> {
  const normalizado = texto.toLowerCase();

  const patrones = await db
    .select({ patron: palabrasBloqueadas.patron, esRegex: palabrasBloqueadas.esRegex })
    .from(palabrasBloqueadas)
    .where(eq(palabrasBloqueadas.activo, true));

  for (const p of patrones) {
    if (p.esRegex) {
      try {
        if (new RegExp(p.patron, "i").test(texto)) return { aprobado: false, motivo: "lenguaje_ofensivo" };
      } catch {
        /* patrón inválido en BD: ignorar */
      }
    } else if (normalizado.includes(p.patron.toLowerCase())) {
      return { aprobado: false, motivo: "lenguaje_ofensivo" };
    }
  }

  if (REGEX_TELEFONO.test(texto)) return { aprobado: false, motivo: "dato_personal_telefono" };
  if (REGEX_RFC.test(texto)) return { aprobado: false, motivo: "dato_personal_rfc" };

  return { aprobado: true };
}

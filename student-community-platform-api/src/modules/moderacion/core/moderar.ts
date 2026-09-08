import type { Db } from "../../../shared/db/client";
import { filtrarTextoLocal, type ResultadoFiltro } from "./filtro-local";

/**
 * Categorías de la API de moderación de OpenAI que hacen que un texto se
 * rechace de forma automática. Sexual, acoso, odio y violencia gráfica.
 * (`self-harm` NO se auto-rechaza: necesita otro trato, se deja para
 * revisión/reportes de la comunidad.)
 */
const CATEGORIAS_BLOQUEO = [
  "sexual",
  "sexual/minors",
  "harassment",
  "harassment/threatening",
  "hate",
  "hate/threatening",
  "violence",
  "violence/graphic",
] as const;

interface RespuestaOpenAI {
  results?: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
}

async function revisarConOpenAI(texto: string, apiKey: string): Promise<ResultadoFiltro> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: texto.slice(0, 8000) }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { aprobado: true }; // fallo del servicio: no bloqueamos por él
    const data = (await res.json()) as RespuestaOpenAI;
    const r = data.results?.[0];
    if (!r) return { aprobado: true };
    const hit = CATEGORIAS_BLOQUEO.find((c) => r.categories[c]);
    if (hit) {
      const motivo = hit.startsWith("sexual")
        ? "contenido_sexual"
        : hit.startsWith("hate")
          ? "discurso_de_odio"
          : hit.startsWith("violence")
            ? "contenido_violento"
            : "acoso_u_ofensa";
      return { aprobado: false, motivo };
    }
    return { aprobado: true };
  } catch {
    // Timeout / red: no bloqueamos (el filtro local ya corrió, y quedan
    // los reportes de la comunidad + el barrido asíncrono como respaldo).
    return { aprobado: true };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Moderación de texto en el alta (síncrona, antes de guardar):
 *  1. Filtro local (tabla `palabras_bloqueadas`: groserías + datos personales).
 *  2. Si hay OPENAI_API_KEY, API de moderación de OpenAI (gratuita):
 *     sexual, acoso, odio, violencia.
 * Si algo no pasa → `{ aprobado: false, motivo }` y quien llama lo rechaza.
 */
export async function moderarTexto(
  db: Db,
  texto: string,
  opts?: { openaiKey?: string },
): Promise<ResultadoFiltro> {
  const local = await filtrarTextoLocal(db, texto);
  if (!local.aprobado) return local;

  if (opts?.openaiKey) {
    return revisarConOpenAI(texto, opts.openaiKey);
  }
  return { aprobado: true };
}

/** Mensaje para el usuario según el motivo del rechazo. */
export function mensajeRechazo(motivo?: string): string {
  switch (motivo) {
    case "contenido_sexual":
      return "El texto tiene contenido sexual o explícito y no se puede publicar.";
    case "discurso_de_odio":
      return "El texto tiene discurso de odio y no se puede publicar.";
    case "contenido_violento":
      return "El texto tiene contenido violento y no se puede publicar.";
    case "acoso_u_ofensa":
    case "lenguaje_ofensivo":
      return "El texto tiene lenguaje ofensivo o de acoso. Reformúlalo sin insultos.";
    case "dato_personal_telefono":
      return "No incluyas números de teléfono. Quítalo y vuelve a intentar.";
    case "dato_personal_rfc":
      return "No incluyas RFC ni datos de identificación. Quítalo y vuelve a intentar.";
    default:
      return "El texto no pasó la revisión automática de contenido.";
  }
}

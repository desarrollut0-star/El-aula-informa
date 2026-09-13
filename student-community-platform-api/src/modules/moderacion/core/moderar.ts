import type { Db } from "../../../shared/db/client";
import { filtrarTextoLocal, type ResultadoFiltro } from "./filtro-local";

export interface OpcionesModeracion {
  huggingfaceKey?: string;
  modeloMlUrl?: string;
  modeloMlToken?: string;
}

/**
 * Modelo de Hugging Face (gratuito vía Inference API) para detectar
 * contenido tóxico/obsceno en español (y otros idiomas): clasificador
 * multilingüe entrenado sobre Jigsaw. Se puede cambiar sin tocar el resto
 * del código.
 */
const HF_MODELO = "citizenlab/distilbert-base-multilingual-cased-toxicity";
const HF_UMBRAL = 0.7;

interface RespuestaHuggingFace {
  label: string;
  score: number;
}

/**
 * Modelo tipo ML (Hugging Face Inference API). Timeout corto y falla
 * abierto: si el servicio falla, tarda o el modelo está "dormido" (los
 * modelos gratuitos se descargan bajo demanda), no bloqueamos — no
 * queremos que la publicación dependa de que un tercero gratuito esté
 * disponible en ese instante.
 */
async function revisarConHuggingFace(texto: string, apiKey: string): Promise<ResultadoFiltro> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODELO}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ inputs: texto.slice(0, 2000), options: { wait_for_model: true } }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { aprobado: true };
    const data = (await res.json()) as unknown;
    const lista = (Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data) as
      | RespuestaHuggingFace[]
      | undefined;
    if (!Array.isArray(lista)) return { aprobado: true };
    const toxico = lista.find(
      (r) => /toxic/i.test(r.label) && !/non.?toxic|not.?toxic/i.test(r.label) && r.score >= HF_UMBRAL,
    );
    return toxico ? { aprobado: false, motivo: "lenguaje_ofensivo" } : { aprobado: true };
  } catch {
    return { aprobado: true };
  } finally {
    clearTimeout(t);
  }
}

interface RespuestaModeloPropio {
  ofensivo: boolean;
  motivo?: string;
  confianza?: number;
}

/**
 * Modelo LLM propio del equipo (Python, servido aparte — ver
 * `moderacion-ml/`) entrenado/ajustado específicamente para este proyecto.
 * Mismo patrón: timeout corto y falla abierto (si el servicio está caído o
 * tarda, no bloqueamos la publicación por eso).
 */
async function revisarConModeloPropio(texto: string, url: string, token?: string): Promise<ResultadoFiltro> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ texto: texto.slice(0, 2000) }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { aprobado: true };
    const data = (await res.json()) as RespuestaModeloPropio;
    if (data.ofensivo) return { aprobado: false, motivo: data.motivo ?? "lenguaje_ofensivo" };
    return { aprobado: true };
  } catch {
    return { aprobado: true };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Moderación de texto en el alta (síncrona, antes de guardar):
 *  1. Filtro local (tabla `palabras_bloqueadas`: groserías + datos personales).
 *  2. Si hay HUGGINGFACE_API_KEY, un modelo ML de Hugging Face (gratuito)
 *     para lenguaje tóxico/obsceno en español.
 *  3. Si hay MODELO_ML_URL, el LLM propio del equipo (`moderacion-ml/`, en
 *     Python) desplegado aparte.
 * Cualquiera de las capas puede rechazar el texto (basta que UNA lo
 * marque). Si algo no pasa → `{ aprobado: false, motivo }` y quien llama
 * lo rechaza.
 */
export async function moderarTexto(db: Db, texto: string, opts?: OpcionesModeracion): Promise<ResultadoFiltro> {
  const local = await filtrarTextoLocal(db, texto);
  if (!local.aprobado) return local;

  if (opts?.huggingfaceKey) {
    const r = await revisarConHuggingFace(texto, opts.huggingfaceKey);
    if (!r.aprobado) return r;
  }
  if (opts?.modeloMlUrl) {
    const r = await revisarConModeloPropio(texto, opts.modeloMlUrl, opts.modeloMlToken);
    if (!r.aprobado) return r;
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

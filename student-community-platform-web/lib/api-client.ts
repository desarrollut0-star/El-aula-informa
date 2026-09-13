import { API_URL } from "./config";
import type {
  Categoria,
  Comentario,
  MiPublicacion,
  Notificacion,
  OpcionEncuesta,
  Programa,
  Sesion,
  TarjetaContenido,
  TipoContenido,
} from "./tipos";

class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/**
 * En el navegador adjunta el token de Supabase Auth como
 * `Authorization: Bearer`. En el servidor (Server Components) no hay token
 * → esas páginas solo pueden pedir datos públicos; las que necesitan
 * sesión son componentes de cliente.
 */
async function encabezadosDeSesion(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  const { supabase } = await import("./supabase");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Corta cualquier petición que tarde más de esto (backend caído/lento). */
const TIMEOUT_MS = 10_000;

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(await encabezadosDeSesion()), ...init?.headers },
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(0, "El servidor no respondió a tiempo. Revisa tu conexión o inténtalo de nuevo.");
    }
    throw new ApiError(0, "No se pudo contactar al servidor.");
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    throw new ApiError(res.status, cuerpo?.error?.mensaje ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ---------- identidad ----------
  sesion: () => pedir<{ session: Sesion | null; versionTerminos: string }>("/identidad/yo"),
  programas: () => pedir<{ programas: Programa[] }>("/identidad/programas"),
  completarPerfil: (programaId: string) =>
    pedir<{ ok: true }>("/identidad/completar-perfil", { method: "POST", body: JSON.stringify({ programaId }) }),
  aceptarTerminos: (version: string) =>
    pedir<{ ok: true }>("/identidad/aceptar-terminos", { method: "POST", body: JSON.stringify({ version }) }),

  // ---------- muro unificado (contenidos) ----------
  feed: (opts?: { tipo?: TipoContenido; cursor?: { fecha: string; id: string } }) => {
    const p = new URLSearchParams();
    if (opts?.tipo) p.set("tipo", opts.tipo);
    if (opts?.cursor) {
      p.set("cursorFecha", opts.cursor.fecha);
      p.set("cursorId", opts.cursor.id);
    }
    const qs = p.toString();
    return pedir<{ tarjetas: TarjetaContenido[] }>(`/contenido/feed${qs ? `?${qs}` : ""}`);
  },
  swiper: () => pedir<{ tarjetas: TarjetaContenido[] }>("/contenido/swiper"),
  contenido: (id: string) => pedir<{ tarjeta: TarjetaContenido }>(`/contenido/${id}`),
  misPublicaciones: () => pedir<{ publicaciones: MiPublicacion[] }>("/contenido/mias"),
  limitePublicaciones: () =>
    pedir<{ usadas: number; limite: number | null; restantes: number | null }>("/contenido/limite"),
  editarContenido: (
    id: string,
    campos: { titulo?: string | null; cuerpo?: string; lugar?: string | null; fechaEvento?: string | null },
  ) => pedir<TarjetaContenido>(`/contenido/${id}`, { method: "PATCH", body: JSON.stringify(campos) }),
  eliminarContenido: (id: string) =>
    pedir<{ eliminado: true }>(`/contenido/${id}`, { method: "DELETE" }),
  editarComentario: (id: string, cid: string, cuerpo: string) =>
    pedir<Comentario>(`/contenido/${id}/comentarios/${cid}`, { method: "PATCH", body: JSON.stringify({ cuerpo }) }),
  eliminarComentario: (id: string, cid: string) =>
    pedir<{ eliminado: true }>(`/contenido/${id}/comentarios/${cid}`, { method: "DELETE" }),
  comentarios: (id: string) => pedir<{ comentarios: Comentario[] }>(`/contenido/${id}/comentarios`),
  comentar: (id: string, cuerpo: string, padreId?: string) =>
    pedir<Comentario>(`/contenido/${id}/comentarios`, {
      method: "POST",
      body: JSON.stringify({ cuerpo, padreId }),
    }),
  publicar: (input: {
    tipo: Exclude<TipoContenido, "denuncia" | "encuesta">;
    titulo?: string;
    cuerpo: string;
    esAnonimo?: boolean;
    /** ISO 8601 — solo para eventos. */
    fechaEvento?: string;
    /** Solo para eventos. */
    lugar?: string;
  }) => pedir<TarjetaContenido>("/contenido", { method: "POST", body: JSON.stringify(input) }),
  /** aFavor: true = apoyar · false = rechazar · null = quitar la reacción. */
  reaccionar: (contenidoId: string, aFavor: boolean | null) =>
    pedir<{ registrado: boolean }>("/contenido/reacciones", {
      method: "POST",
      body: JSON.stringify({ contenidoId, aFavor }),
    }),

  // ---------- encuestas ----------
  publicarEncuesta: (input: {
    titulo?: string;
    cuerpo: string;
    esAnonimo?: boolean;
    /** ISO 8601. */
    cierraEn: string;
    opciones: string[];
  }) => pedir<TarjetaContenido>("/contenido/encuestas", { method: "POST", body: JSON.stringify(input) }),
  opcionesEncuesta: (contenidoId: string) =>
    pedir<{ opciones: OpcionEncuesta[] }>(`/contenido/${contenidoId}/opciones`),
  votar: (contenidoId: string, opcionId: string) =>
    pedir<{ opciones: OpcionEncuesta[] }>(`/contenido/${contenidoId}/votar`, {
      method: "POST",
      body: JSON.stringify({ opcionId }),
    }),

  // ---------- firmas ----------
  firmar: (programaId: string) =>
    pedir<{ firmado: true }>("/firmas", { method: "POST", body: JSON.stringify({ programaId }) }),
  miFirma: () => pedir<{ firmado: boolean }>("/firmas/mi-firma"),

  // ---------- denuncias ----------
  categoriasDenuncia: () => pedir<{ categorias: Categoria[] }>("/denuncias/categorias"),
  crearDenuncia: (categoriaId: string, texto: string, esAnonimo: boolean) =>
    pedir<{ id: string }>("/denuncias", { method: "POST", body: JSON.stringify({ categoriaId, texto, esAnonimo }) }),
  confirmarTestigo: (contenidoId: string) =>
    pedir<{ confirmaciones: number; noVerificada: boolean }>(`/denuncias/${contenidoId}/confirmar`, { method: "POST" }),

  // ---------- moderación ----------
  reportar: (objetivo: "contenido" | "comentario", objetivoId: string, motivo: string, detalle?: string) =>
    pedir<{ totalReportes: number; autoOcultado: boolean }>("/moderacion/reportar", {
      method: "POST",
      body: JSON.stringify({ objetivo, objetivoId, motivo, detalle }),
    }),

  // ---------- notificaciones ----------
  notificaciones: () => pedir<{ notificaciones: Notificacion[] }>("/notificaciones"),
  notificacionesNoLeidas: () => pedir<{ total: number }>("/notificaciones/no-leidas"),
  marcarNotificacionLeida: (id: string) => pedir<{ ok: true }>(`/notificaciones/${id}/leer`, { method: "POST" }),
  marcarTodasLeidas: () => pedir<{ marcadas: number }>("/notificaciones/leer-todas", { method: "POST" }),
};

export { ApiError };

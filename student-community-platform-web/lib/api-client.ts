import { API_URL } from "./config";
import type {
  Categoria,
  Comentario,
  MiPublicacion,
  Notificacion,
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

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${ruta}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(await encabezadosDeSesion()), ...init?.headers },
    cache: "no-store",
  });
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
  feed: (opts?: { tipo?: TipoContenido; cursor?: { score: number; id: string } }) => {
    const p = new URLSearchParams();
    if (opts?.tipo) p.set("tipo", opts.tipo);
    if (opts?.cursor) {
      p.set("cursorScore", String(opts.cursor.score));
      p.set("cursorId", opts.cursor.id);
    }
    const qs = p.toString();
    return pedir<{ tarjetas: TarjetaContenido[] }>(`/contenido/feed${qs ? `?${qs}` : ""}`);
  },
  swiper: () => pedir<{ tarjetas: TarjetaContenido[] }>("/contenido/swiper"),
  contenido: (id: string) => pedir<{ tarjeta: TarjetaContenido }>(`/contenido/${id}`),
  misPublicaciones: () => pedir<{ publicaciones: MiPublicacion[] }>("/contenido/mias"),
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
};

export { ApiError };

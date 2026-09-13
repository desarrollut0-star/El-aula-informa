export type Nivel = "bajo" | "medio" | "alto";
export type Rol = "no_verificado" | "verificado";
export type TipoContenido =
  | "testimonio"
  | "aviso"
  | "evento"
  | "novedad"
  | "propuesta"
  | "encuesta"
  | "denuncia";

export interface Sesion {
  usuarioId: string;
  alias: string;
  rol: Rol;
  programaId: string | null;
  esCuentaOficial: boolean;
  aceptoTerminos: boolean;
}

export interface Programa {
  id: string;
  nombre: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

/** Una tarjeta del muro unificado — fila de la vista `vista_muro`. */
export interface TarjetaContenido {
  id: string;
  tipo: TipoContenido;
  programaId: string | null;
  titulo: string | null;
  cuerpo: string;
  /** null cuando esAnonimo — la vista ya lo enmascara. */
  autorAlias: string | null;
  /** Nombre del programa/carrera del autor. null si es anónimo o cuenta oficial. */
  autorPrograma: string | null;
  autorOficial: boolean;
  esAnonimo: boolean;
  nivel: Nivel;
  fijado: boolean;
  fechaEvento: string | null;
  lugar: string | null;
  cierraEn: string | null;
  encuestaCerrada: boolean;
  /** solo en denuncias: true hasta que 5 testigos confirman. */
  noVerificada: boolean | null;
  categoriaDenuncia: string | null;
  score: number;
  totalApoyos: number;
  totalRechazos: number;
  totalComentarios: number;
  creadoEn: string;
  /** true = ya apoyaste · false = ya rechazaste · null = no has reaccionado. */
  miReaccion?: boolean | null;
  /** true si la publicación es tuya (para mostrar editar / eliminar). */
  esMio?: boolean;
}

export type EstadoContenido = "visible" | "en_revision" | "oculto" | "rechazado";

export interface OpcionEncuesta {
  id: string;
  texto: string;
  orden: number;
  totalVotos: number;
  /** true si YO ya voté por esta opción. */
  miVoto: boolean;
}

export interface MiPublicacion {
  id: string;
  tipo: TipoContenido;
  titulo: string | null;
  cuerpo: string;
  estado: EstadoContenido;
  esAnonimo: boolean;
  totalApoyos: number;
  totalRechazos: number;
  totalComentarios: number;
  creadoEn: string;
}

export interface Comentario {
  id: string;
  padreId: string | null;
  cuerpo: string;
  esRespuestaOficial: boolean;
  autorAlias: string;
  autorOficial: boolean;
  autorPrograma: string | null;
  creadoEn: string;
  editadoEn: string | null;
  esMio: boolean;
}

export interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  /** Publicación relacionada, si la hay: la notificación enlaza a ella. */
  contenidoId: string | null;
  leidaEn: string | null;
  creadoEn: string;
}

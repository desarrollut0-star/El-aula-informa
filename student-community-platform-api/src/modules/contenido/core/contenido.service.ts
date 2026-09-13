import type { Db } from "../../../shared/db/client";
import { ContenidoRepository } from "./contenido.repository";
import { TIPOS_SOLO_CUENTA_OFICIAL, TIPOS_CON_FLUJO_PROPIO, type TipoContenido } from "./contenido.types";
import { publish } from "../../../shared/events/bus";
import { AppError } from "../../../shared/http/error";
import { asegurarLimiteDiario } from "./limite-diario";
import { moderarTexto, mensajeRechazo, type OpcionesModeracion } from "../../moderacion/core/moderar";

export class ContenidoService {
  private readonly repo: ContenidoRepository;

  constructor(
    private readonly db: Db,
    private readonly moderacion?: OpcionesModeracion,
  ) {
    this.repo = new ContenidoRepository(db);
  }

  /** Revisión automática síncrona; lanza 422 si el texto no pasa. */
  private async revisar(...textos: (string | null | undefined)[]) {
    const texto = textos.filter(Boolean).join("\n");
    if (!texto) return;
    const r = await moderarTexto(this.db, texto, this.moderacion);
    if (!r.aprobado) {
      throw new AppError(422, "CONTENIDO_RECHAZADO", mensajeRechazo(r.motivo));
    }
  }

  puedePublicar(tipo: TipoContenido, esCuentaOficial: boolean): boolean {
    if (TIPOS_CON_FLUJO_PROPIO.includes(tipo)) return false;
    return TIPOS_SOLO_CUENTA_OFICIAL.includes(tipo) ? esCuentaOficial : true;
  }

  async publicar(input: {
    tipo: TipoContenido;
    autorId: string;
    programaId: string | null;
    esCuentaOficial: boolean;
    titulo: string | null;
    cuerpo: string;
    esAnonimo: boolean;
    fechaEvento?: Date;
    lugar?: string;
    cierraEn?: Date;
  }) {
    if (!this.puedePublicar(input.tipo, input.esCuentaOficial)) {
      throw new AppError(403, "TIPO_NO_PERMITIDO", "No puedes publicar este tipo de contenido.");
    }
    if (input.cuerpo.trim().length === 0) {
      throw new AppError(400, "CUERPO_VACIO", "El contenido no puede estar vacío.");
    }
    await this.revisar(input.titulo, input.cuerpo);
    await asegurarLimiteDiario(this.db, input.autorId, input.esCuentaOficial);

    const contenido = await this.repo.crear(input);
    await publish(this.db, {
      type: "ContenidoPublicado",
      payload: { contenidoId: contenido.id, tipo: contenido.tipo, cuerpo: contenido.cuerpo },
    });
    return contenido;
  }

  feed(opciones: { usuarioId: string; tipo?: TipoContenido; cursor?: { fecha: string; id: string } }) {
    return this.repo.feed(opciones);
  }

  async porId(id: string, usuarioId: string) {
    const tarjeta = await this.repo.porId(id, usuarioId);
    if (!tarjeta) throw new AppError(404, "NO_ENCONTRADO", "Esa publicación no existe o fue retirada.");
    return tarjeta;
  }

  mias(usuarioId: string) {
    return this.repo.mias(usuarioId);
  }

  async editar(
    id: string,
    autorId: string,
    campos: { titulo?: string | null; cuerpo?: string; lugar?: string | null; fechaEvento?: Date | null },
  ) {
    if (campos.cuerpo !== undefined && campos.cuerpo.trim().length === 0) {
      throw new AppError(400, "CUERPO_VACIO", "El contenido no puede quedar vacío.");
    }
    await this.revisar(campos.titulo, campos.cuerpo);
    const fila = await this.repo.editar(id, autorId, campos);
    if (!fila) throw new AppError(404, "NO_ENCONTRADO", "No encontramos esa publicación tuya.");
    return fila;
  }

  async eliminar(id: string, autorId: string) {
    const ok = await this.repo.eliminar(id, autorId);
    if (!ok) throw new AppError(404, "NO_ENCONTRADO", "No encontramos esa publicación tuya.");
    return { eliminado: true };
  }

  siguientesParaSwiper(usuarioId: string) {
    return this.repo.siguientesParaSwiper(usuarioId);
  }

  reaccionar(usuarioId: string, contenidoId: string, aFavor: boolean | null) {
    return aFavor === null
      ? this.repo.quitarReaccion(usuarioId, contenidoId)
      : this.repo.reaccionar(usuarioId, contenidoId, aFavor);
  }

  comentarios(contenidoId: string, usuarioId: string) {
    return this.repo.comentarios(contenidoId, usuarioId);
  }

  async editarComentario(id: string, autorId: string, cuerpo: string) {
    if (cuerpo.trim().length === 0) {
      throw new AppError(400, "CUERPO_VACIO", "El comentario no puede quedar vacío.");
    }
    await this.revisar(cuerpo);
    const fila = await this.repo.editarComentario(id, autorId, cuerpo.trim());
    if (!fila) throw new AppError(404, "NO_ENCONTRADO", "No encontramos ese comentario tuyo.");
    return fila;
  }

  async eliminarComentario(id: string, autorId: string) {
    const ok = await this.repo.eliminarComentario(id, autorId);
    if (!ok) throw new AppError(404, "NO_ENCONTRADO", "No encontramos ese comentario tuyo.");
    return { eliminado: true };
  }

  /** Publicar una encuesta (pregunta + opciones + fecha de cierre). */
  async publicarEncuesta(input: {
    autorId: string;
    programaId: string | null;
    esCuentaOficial: boolean;
    titulo: string | null;
    cuerpo: string;
    esAnonimo: boolean;
    cierraEn: Date;
    opciones: string[];
  }) {
    if (input.cuerpo.trim().length === 0) {
      throw new AppError(400, "CUERPO_VACIO", "La pregunta de la encuesta no puede estar vacía.");
    }
    const opciones = input.opciones.map((o) => o.trim()).filter(Boolean);
    if (opciones.length < 2 || opciones.length > 6) {
      throw new AppError(400, "OPCIONES_INVALIDAS", "Una encuesta necesita entre 2 y 6 opciones.");
    }
    if (new Set(opciones.map((o) => o.toLowerCase())).size !== opciones.length) {
      throw new AppError(400, "OPCIONES_INVALIDAS", "No repitas la misma opción dos veces.");
    }
    if (input.cierraEn.getTime() <= Date.now()) {
      throw new AppError(400, "CIERRE_INVALIDO", "La fecha de cierre debe ser en el futuro.");
    }
    await this.revisar(input.titulo, input.cuerpo, ...opciones);
    await asegurarLimiteDiario(this.db, input.autorId, input.esCuentaOficial);

    const contenido = await this.repo.crearEncuesta({ ...input, opciones });
    await publish(this.db, {
      type: "ContenidoPublicado",
      payload: { contenidoId: contenido.id, tipo: contenido.tipo, cuerpo: contenido.cuerpo },
    });
    return contenido;
  }

  /** Opciones de una encuesta con su conteo y si YO ya voté cuál. */
  async opciones(contenidoId: string, usuarioId: string) {
    await this.porId(contenidoId, usuarioId); // valida que exista/sea visible
    return this.repo.opciones(contenidoId, usuarioId);
  }

  /** Votar (o cambiar mi voto, mientras la encuesta siga abierta). */
  async votar(contenidoId: string, usuarioId: string, opcionId: string) {
    const tarjeta = await this.porId(contenidoId, usuarioId);
    if (tarjeta.tipo !== "encuesta") {
      throw new AppError(400, "NO_ES_ENCUESTA", "Esto no es una encuesta.");
    }
    if (tarjeta.encuestaCerrada) {
      throw new AppError(409, "ENCUESTA_CERRADA", "Esta encuesta ya cerró, ya no se puede votar.");
    }
    const opciones = await this.repo.opciones(contenidoId, usuarioId);
    if (!opciones.some((o) => o.id === opcionId)) {
      throw new AppError(400, "OPCION_INVALIDA", "Esa opción no pertenece a esta encuesta.");
    }
    await this.repo.votar(contenidoId, usuarioId, opcionId);
    return this.repo.opciones(contenidoId, usuarioId);
  }

  async comentar(input: {
    contenidoId: string;
    autorId: string;
    esCuentaOficial: boolean;
    cuerpo: string;
    padreId?: string;
  }) {
    if (input.cuerpo.trim().length === 0) {
      throw new AppError(400, "CUERPO_VACIO", "El comentario no puede estar vacío.");
    }
    await this.revisar(input.cuerpo);
    // Confirma que la tarjeta existe y es visible (porId lanza 404 si no).
    await this.repo.porId(input.contenidoId, input.autorId);
    // Si es respuesta, el padre debe ser un comentario raíz de esta misma tarjeta.
    if (input.padreId && !(await this.repo.padreValido(input.padreId, input.contenidoId))) {
      throw new AppError(400, "PADRE_INVALIDO", "No se puede responder a ese comentario.");
    }
    return this.repo.comentar({
      contenidoId: input.contenidoId,
      autorId: input.autorId,
      cuerpo: input.cuerpo.trim(),
      padreId: input.padreId,
      esRespuestaOficial: input.esCuentaOficial,
    });
  }
}

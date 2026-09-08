import type { Db } from "../../../shared/db/client";
import { ContenidoRepository } from "./contenido.repository";
import { TIPOS_SOLO_CUENTA_OFICIAL, TIPOS_CON_FLUJO_PROPIO, type TipoContenido } from "./contenido.types";
import { publish } from "../../../shared/events/bus";
import { AppError } from "../../../shared/http/error";

export class ContenidoService {
  private readonly repo: ContenidoRepository;

  constructor(private readonly db: Db) {
    this.repo = new ContenidoRepository(db);
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

    const contenido = await this.repo.crear(input);
    await publish(this.db, {
      type: "ContenidoPublicado",
      payload: { contenidoId: contenido.id, tipo: contenido.tipo, cuerpo: contenido.cuerpo },
    });
    return contenido;
  }

  feed(opciones: { usuarioId: string; tipo?: TipoContenido; cursor?: { score: number; id: string } }) {
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

  siguientesParaSwiper(usuarioId: string) {
    return this.repo.siguientesParaSwiper(usuarioId);
  }

  reaccionar(usuarioId: string, contenidoId: string, aFavor: boolean | null) {
    return aFavor === null
      ? this.repo.quitarReaccion(usuarioId, contenidoId)
      : this.repo.reaccionar(usuarioId, contenidoId, aFavor);
  }

  comentarios(contenidoId: string) {
    return this.repo.comentarios(contenidoId);
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
    // Confirma que la tarjeta existe y es visible (porId lanza 404 si no).
    await this.repo.porId(input.contenidoId, input.autorId);
    return this.repo.comentar({
      contenidoId: input.contenidoId,
      autorId: input.autorId,
      cuerpo: input.cuerpo.trim(),
      padreId: input.padreId,
      esRespuestaOficial: input.esCuentaOficial,
    });
  }
}

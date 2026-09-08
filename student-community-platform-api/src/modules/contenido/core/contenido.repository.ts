import { and, asc, desc, eq, isNull, notExists, sql } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { programas, usuarios } from "../../identidad/schema";
import { comentarios, contenidos, reacciones, vistaMuro } from "../schema";
import type { TipoContenido } from "./contenido.types";

/**
 * Columnas del muro + el NOMBRE del programa del autor (para pintar la
 * "carrera" en la tarjeta). La vista ya deja `programa_id` en NULL cuando
 * la publicación es anónima, así que el join no filtra nada indebido.
 */
const columnasMuro = {
  id: vistaMuro.id,
  tipo: vistaMuro.tipo,
  titulo: vistaMuro.titulo,
  cuerpo: vistaMuro.cuerpo,
  nivel: vistaMuro.nivel,
  fijado: vistaMuro.fijado,
  score: vistaMuro.score,
  totalApoyos: vistaMuro.totalApoyos,
  totalRechazos: vistaMuro.totalRechazos,
  totalComentarios: vistaMuro.totalComentarios,
  esAnonimo: vistaMuro.esAnonimo,
  autorAlias: vistaMuro.autorAlias,
  programaId: vistaMuro.programaId,
  autorOficial: vistaMuro.autorOficial,
  fechaEvento: vistaMuro.fechaEvento,
  lugar: vistaMuro.lugar,
  cierraEn: vistaMuro.cierraEn,
  encuestaCerrada: vistaMuro.encuestaCerrada,
  noVerificada: vistaMuro.noVerificada,
  categoriaDenuncia: vistaMuro.categoriaDenuncia,
  creadoEn: vistaMuro.creadoEn,
  autorPrograma: programas.nombre,
};

/** `true`/`false` si el usuario ya reaccionó a esa tarjeta; `null` si no. */
function miReaccion(usuarioId: string) {
  return sql<boolean | null>`(
    select r.a_favor from reacciones r
    where r.contenido_id = ${vistaMuro.id} and r.usuario_id = ${usuarioId}
  )`.as("miReaccion");
}

/** `true` si la tarjeta la escribió este usuario (para mostrar editar/eliminar). */
function esMio(usuarioId: string) {
  return sql<boolean>`(
    select c.autor_id = ${usuarioId} from contenidos c where c.id = ${vistaMuro.id}
  )`.as("esMio");
}

/**
 * Lecturas del muro: SIEMPRE desde `vista_muro` (la vista ya resuelve el
 * anonimato — autor_alias sale null desde el SQL, ninguna consulta puede
 * filtrar mal un alias anónimo). Los contadores los mantienen triggers;
 * el backend nunca los escribe.
 */
export class ContenidoRepository {
  constructor(private readonly db: Db) {}

  async crear(input: {
    tipo: TipoContenido;
    autorId: string;
    programaId: string | null;
    titulo: string | null;
    cuerpo: string;
    esAnonimo: boolean;
    fechaEvento?: Date;
    lugar?: string;
    cierraEn?: Date;
  }) {
    const [fila] = await this.db.insert(contenidos).values(input).returning();
    return fila;
  }

  /**
   * Feed unificado en orden cronológico (más reciente primero), con cursor
   * (creado_en, id) para el scroll infinito. El frontend agrupa por día.
   * Los fijados conservan su etiqueta pero no se sacan de su lugar temporal.
   */
  async feed(opciones: {
    usuarioId: string;
    tipo?: TipoContenido;
    cursor?: { fecha: string; id: string };
    limite?: number;
  }) {
    const { usuarioId, tipo, cursor, limite = 20 } = opciones;
    return this.db
      .select({ ...columnasMuro, miReaccion: miReaccion(usuarioId), esMio: esMio(usuarioId) })
      .from(vistaMuro)
      .leftJoin(programas, eq(programas.id, vistaMuro.programaId))
      .where(
        and(
          tipo ? eq(vistaMuro.tipo, tipo) : undefined,
          cursor
            ? sql`(${vistaMuro.creadoEn}, ${vistaMuro.id}) < (${cursor.fecha}::timestamptz, ${cursor.id}::uuid)`
            : undefined,
        ),
      )
      .orderBy(desc(vistaMuro.creadoEn), desc(vistaMuro.id))
      .limit(limite);
  }

  /** Una sola tarjeta (para el detalle). */
  async porId(id: string, usuarioId: string) {
    const [fila] = await this.db
      .select({ ...columnasMuro, miReaccion: miReaccion(usuarioId), esMio: esMio(usuarioId) })
      .from(vistaMuro)
      .leftJoin(programas, eq(programas.id, vistaMuro.programaId))
      .where(eq(vistaMuro.id, id))
      .limit(1);
    return fila ?? null;
  }

  /** Todo lo que ha publicado un usuario, con su estado (incluye no visibles). */
  async mias(usuarioId: string, limite = 50) {
    return this.db
      .select({
        id: contenidos.id,
        tipo: contenidos.tipo,
        titulo: contenidos.titulo,
        cuerpo: contenidos.cuerpo,
        estado: contenidos.estado,
        esAnonimo: contenidos.esAnonimo,
        totalApoyos: contenidos.totalApoyos,
        totalRechazos: contenidos.totalRechazos,
        totalComentarios: contenidos.totalComentarios,
        creadoEn: contenidos.creadoEn,
      })
      .from(contenidos)
      .where(eq(contenidos.autorId, usuarioId))
      .orderBy(desc(contenidos.creadoEn))
      .limit(limite);
  }

  /** Editar la propia tarjeta. Filtra por autor: si no es suya, no toca nada. */
  async editar(
    id: string,
    autorId: string,
    campos: { titulo?: string | null; cuerpo?: string; lugar?: string | null; fechaEvento?: Date | null },
  ) {
    const [fila] = await this.db
      .update(contenidos)
      .set({ ...campos, editadoEn: new Date() })
      .where(and(eq(contenidos.id, id), eq(contenidos.autorId, autorId)))
      .returning();
    return fila ?? null;
  }

  /** Borrar la propia tarjeta (los comentarios/reacciones caen por FK cascade). */
  async eliminar(id: string, autorId: string) {
    const filas = await this.db
      .delete(contenidos)
      .where(and(eq(contenidos.id, id), eq(contenidos.autorId, autorId)))
      .returning({ id: contenidos.id });
    return filas.length > 0;
  }

  /** Vista swiper: testimonios visibles que este usuario no ha reaccionado. */
  async siguientesParaSwiper(usuarioId: string, limite = 20) {
    return this.db
      .select(columnasMuro)
      .from(vistaMuro)
      .leftJoin(programas, eq(programas.id, vistaMuro.programaId))
      .where(
        and(
          eq(vistaMuro.tipo, "testimonio"),
          notExists(
            this.db
              .select()
              .from(reacciones)
              .where(and(eq(reacciones.usuarioId, usuarioId), eq(reacciones.contenidoId, vistaMuro.id))),
          ),
        ),
      )
      .orderBy(desc(vistaMuro.creadoEn))
      .limit(limite);
  }

  /** Idempotente + permite cambiar de opinión. El trigger ajusta los contadores. */
  async reaccionar(usuarioId: string, contenidoId: string, aFavor: boolean) {
    await this.db
      .insert(reacciones)
      .values({ usuarioId, contenidoId, aFavor })
      .onConflictDoUpdate({ target: [reacciones.usuarioId, reacciones.contenidoId], set: { aFavor } });
    return { registrado: true };
  }

  /** Quitar la reacción (des-apoyar / des-rechazar). */
  async quitarReaccion(usuarioId: string, contenidoId: string) {
    await this.db
      .delete(reacciones)
      .where(and(eq(reacciones.usuarioId, usuarioId), eq(reacciones.contenidoId, contenidoId)));
    return { registrado: false };
  }

  // ---------- comentarios ----------

  async comentarios(contenidoId: string, usuarioId: string) {
    return this.db
      .select({
        id: comentarios.id,
        padreId: comentarios.padreId,
        cuerpo: comentarios.cuerpo,
        esRespuestaOficial: comentarios.esRespuestaOficial,
        creadoEn: comentarios.creadoEn,
        editadoEn: comentarios.editadoEn,
        autorAlias: usuarios.alias,
        autorOficial: usuarios.esCuentaOficial,
        autorPrograma: programas.nombre,
        esMio: sql<boolean>`${comentarios.autorId} = ${usuarioId}`,
      })
      .from(comentarios)
      .innerJoin(usuarios, eq(usuarios.id, comentarios.autorId))
      .leftJoin(programas, eq(programas.id, usuarios.programaId))
      .where(
        and(
          eq(comentarios.contenidoId, contenidoId),
          eq(comentarios.estado, "visible"),
          isNull(comentarios.eliminadoEn),
        ),
      )
      .orderBy(asc(comentarios.creadoEn))
      .limit(200);
  }

  async comentar(input: {
    contenidoId: string;
    autorId: string;
    cuerpo: string;
    padreId?: string;
    esRespuestaOficial: boolean;
  }) {
    const [fila] = await this.db.insert(comentarios).values(input).returning();
    return fila;
  }

  /** Editar el propio comentario. */
  async editarComentario(id: string, autorId: string, cuerpo: string) {
    const [fila] = await this.db
      .update(comentarios)
      .set({ cuerpo, editadoEn: new Date() })
      .where(and(eq(comentarios.id, id), eq(comentarios.autorId, autorId), isNull(comentarios.eliminadoEn)))
      .returning();
    return fila ?? null;
  }

  /** Borrado lógico del propio comentario (el trigger baja total_comentarios). */
  async eliminarComentario(id: string, autorId: string) {
    const filas = await this.db
      .update(comentarios)
      .set({ eliminadoEn: new Date() })
      .where(and(eq(comentarios.id, id), eq(comentarios.autorId, autorId), isNull(comentarios.eliminadoEn)))
      .returning({ id: comentarios.id });
    return filas.length > 0;
  }

  async ocultar(contenidoId: string) {
    await this.db.update(contenidos).set({ estado: "oculto" }).where(eq(contenidos.id, contenidoId));
  }
}

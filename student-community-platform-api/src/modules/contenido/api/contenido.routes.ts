import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../../env";
import { requireRole, requireSesion } from "../../../shared/auth/middleware";
import { validarJson } from "../../../shared/http/validate";
import { ContenidoService } from "../core/contenido.service";
import { limiteDiario } from "../core/limite-diario";
import type { TipoContenido } from "../core/contenido.types";

export const contenidoRoutes = new Hono<AppEnv>();

/** Arma el servicio con las 3 capas de moderación configuradas en el Worker. */
function servicio(c: Context<AppEnv>) {
  return new ContenidoService(c.get("db"), {
    openaiKey: c.env.OPENAI_API_KEY,
    huggingfaceKey: c.env.HUGGINGFACE_API_KEY,
    modeloMlUrl: c.env.MODELO_ML_URL,
    modeloMlToken: c.env.MODELO_ML_TOKEN,
  });
}

const publicarSchema = z.object({
  tipo: z.enum(["testimonio", "aviso", "evento", "novedad", "propuesta"]),
  titulo: z.string().max(140).optional(),
  cuerpo: z.string().min(1).max(4000),
  esAnonimo: z.boolean().default(false),
  fechaEvento: z.string().datetime().optional(),
  lugar: z.string().max(160).optional(),
  cierraEn: z.string().datetime().optional(),
});

// aFavor: true = apoyar, false = rechazar, null = quitar la reacción.
const reaccionSchema = z.object({ contenidoId: z.string().uuid(), aFavor: z.boolean().nullable() });

const comentarSchema = z.object({
  cuerpo: z.string().min(1).max(2000),
  padreId: z.string().uuid().optional(),
});

const editarSchema = z
  .object({
    titulo: z.string().max(140).nullable().optional(),
    cuerpo: z.string().min(1).max(4000).optional(),
    lugar: z.string().max(160).nullable().optional(),
    fechaEvento: z.string().datetime().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nada que actualizar" });

const editarComentarioSchema = z.object({ cuerpo: z.string().min(1).max(2000) });

const encuestaSchema = z.object({
  titulo: z.string().max(140).optional(),
  cuerpo: z.string().min(1).max(2000),
  esAnonimo: z.boolean().default(false),
  cierraEn: z.string().datetime(),
  opciones: z.array(z.string().min(1).max(120)).min(2).max(6),
});

const votarSchema = z.object({ opcionId: z.string().uuid() });

/** Publicar cualquier tipo de contenido del muro (menos denuncia/encuesta). */
contenidoRoutes.post("/", requireRole(), validarJson(publicarSchema), async (c) => {
  const session = c.get("session")!;
  const d = c.req.valid("json");
  const contenido = await servicio(c).publicar({
    tipo: d.tipo,
    autorId: session.usuarioId,
    programaId: session.programaId,
    esCuentaOficial: session.esCuentaOficial,
    titulo: d.titulo ?? null,
    cuerpo: d.cuerpo,
    esAnonimo: d.esAnonimo,
    fechaEvento: d.fechaEvento ? new Date(d.fechaEvento) : undefined,
    lugar: d.lugar,
    cierraEn: d.cierraEn ? new Date(d.cierraEn) : undefined,
  });
  return c.json(contenido, 201);
});

/** Publicar una encuesta: pregunta + entre 2 y 6 opciones + fecha de cierre. */
contenidoRoutes.post("/encuestas", requireRole(), validarJson(encuestaSchema), async (c) => {
  const session = c.get("session")!;
  const d = c.req.valid("json");
  const contenido = await servicio(c).publicarEncuesta({
    autorId: session.usuarioId,
    programaId: session.programaId,
    esCuentaOficial: session.esCuentaOficial,
    titulo: d.titulo ?? null,
    cuerpo: d.cuerpo,
    esAnonimo: d.esAnonimo,
    cierraEn: new Date(d.cierraEn),
    opciones: d.opciones,
  });
  return c.json(contenido, 201);
});

/** Feed unificado del muro (scroll infinito). Solo para la comunidad con sesión. */
contenidoRoutes.get("/feed", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const tipo = c.req.query("tipo") as TipoContenido | undefined;
  const cursorFecha = c.req.query("cursorFecha");
  const cursorId = c.req.query("cursorId");
  const cursor = cursorFecha && cursorId ? { fecha: cursorFecha, id: cursorId } : undefined;
  const tarjetas = await servicio(c).feed({ usuarioId: session.usuarioId, tipo, cursor });
  return c.json({ tarjetas });
});

/** Cuántas publicaciones me quedan hoy (para avisar en los formularios). */
contenidoRoutes.get("/limite", requireSesion(), async (c) => {
  const s = c.get("session")!;
  return c.json(await limiteDiario(c.get("db"), s.usuarioId, s.esCuentaOficial));
});

/** Lo que YO he publicado, con su estado. */
contenidoRoutes.get("/mias", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const publicaciones = await servicio(c).mias(session.usuarioId);
  return c.json({ publicaciones });
});

/** Vista swiper: testimonios que este usuario no ha reaccionado. */
contenidoRoutes.get("/swiper", requireRole(), async (c) => {
  const session = c.get("session")!;
  const tarjetas = await servicio(c).siguientesParaSwiper(session.usuarioId);
  return c.json({ tarjetas });
});

contenidoRoutes.post("/reacciones", requireRole(), validarJson(reaccionSchema), async (c) => {
  const session = c.get("session")!;
  const { contenidoId, aFavor } = c.req.valid("json");
  const resultado = await servicio(c).reaccionar(session.usuarioId, contenidoId, aFavor);
  return c.json(resultado);
});

/** Detalle de una tarjeta. */
contenidoRoutes.get("/:id", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const tarjeta = await servicio(c).porId(c.req.param("id"), session.usuarioId);
  return c.json({ tarjeta });
});

/** Opciones de una encuesta, con el conteo y si YO ya voté cuál. */
contenidoRoutes.get("/:id/opciones", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const opciones = await servicio(c).opciones(
    c.req.param("id"),
    session.usuarioId,
  );
  return c.json({ opciones });
});

/** Votar en una encuesta (o cambiar mi voto mientras siga abierta). */
contenidoRoutes.post("/:id/votar", requireRole(), validarJson(votarSchema), async (c) => {
  const session = c.get("session")!;
  const opciones = await servicio(c).votar(
    c.req.param("id"),
    session.usuarioId,
    c.req.valid("json").opcionId,
  );
  return c.json({ opciones });
});

/** Editar la propia publicación. */
contenidoRoutes.patch("/:id", requireRole(), validarJson(editarSchema), async (c) => {
  const session = c.get("session")!;
  const d = c.req.valid("json");
  const fila = await servicio(c).editar(c.req.param("id"), session.usuarioId, {
    titulo: d.titulo,
    cuerpo: d.cuerpo,
    lugar: d.lugar,
    fechaEvento: d.fechaEvento === undefined ? undefined : d.fechaEvento === null ? null : new Date(d.fechaEvento),
  });
  return c.json(fila);
});

/** Borrar la propia publicación. */
contenidoRoutes.delete("/:id", requireRole(), async (c) => {
  const session = c.get("session")!;
  const r = await servicio(c).eliminar(c.req.param("id"), session.usuarioId);
  return c.json(r);
});

/** Hilo de comentarios de una tarjeta. */
contenidoRoutes.get("/:id/comentarios", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const comentarios = await servicio(c).comentarios(c.req.param("id"), session.usuarioId);
  return c.json({ comentarios });
});

/** Comentar en una tarjeta (o responder, con padreId). */
contenidoRoutes.post("/:id/comentarios", requireRole(), validarJson(comentarSchema), async (c) => {
  const session = c.get("session")!;
  const { cuerpo, padreId } = c.req.valid("json");
  const comentario = await servicio(c).comentar({
    contenidoId: c.req.param("id"),
    autorId: session.usuarioId,
    esCuentaOficial: session.esCuentaOficial,
    cuerpo,
    padreId,
  });
  return c.json(comentario, 201);
});

/** Editar el propio comentario. */
contenidoRoutes.patch("/:id/comentarios/:cid", requireRole(), validarJson(editarComentarioSchema), async (c) => {
  const session = c.get("session")!;
  const fila = await servicio(c).editarComentario(
    c.req.param("cid"),
    session.usuarioId,
    c.req.valid("json").cuerpo,
  );
  return c.json(fila);
});

/** Borrar el propio comentario. */
contenidoRoutes.delete("/:id/comentarios/:cid", requireRole(), async (c) => {
  const session = c.get("session")!;
  const r = await servicio(c).eliminarComentario(c.req.param("cid"), session.usuarioId);
  return c.json(r);
});

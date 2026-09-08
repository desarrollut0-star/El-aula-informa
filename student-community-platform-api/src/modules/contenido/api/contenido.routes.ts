import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../../env";
import { requireRole, requireSesion } from "../../../shared/auth/middleware";
import { validarJson } from "../../../shared/http/validate";
import { ContenidoService } from "../core/contenido.service";
import { limiteDiario } from "../core/limite-diario";
import type { TipoContenido } from "../core/contenido.types";

export const contenidoRoutes = new Hono<AppEnv>();

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

/** Publicar cualquier tipo de contenido del muro (menos denuncia/encuesta). */
contenidoRoutes.post("/", requireRole(), validarJson(publicarSchema), async (c) => {
  const session = c.get("session")!;
  const d = c.req.valid("json");
  const contenido = await new ContenidoService(c.get("db")).publicar({
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

/** Feed unificado del muro (scroll infinito). Solo para la comunidad con sesión. */
contenidoRoutes.get("/feed", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const tipo = c.req.query("tipo") as TipoContenido | undefined;
  const cursorFecha = c.req.query("cursorFecha");
  const cursorId = c.req.query("cursorId");
  const cursor = cursorFecha && cursorId ? { fecha: cursorFecha, id: cursorId } : undefined;
  const tarjetas = await new ContenidoService(c.get("db")).feed({ usuarioId: session.usuarioId, tipo, cursor });
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
  const publicaciones = await new ContenidoService(c.get("db")).mias(session.usuarioId);
  return c.json({ publicaciones });
});

/** Vista swiper: testimonios que este usuario no ha reaccionado. */
contenidoRoutes.get("/swiper", requireRole(), async (c) => {
  const session = c.get("session")!;
  const tarjetas = await new ContenidoService(c.get("db")).siguientesParaSwiper(session.usuarioId);
  return c.json({ tarjetas });
});

contenidoRoutes.post("/reacciones", requireRole(), validarJson(reaccionSchema), async (c) => {
  const session = c.get("session")!;
  const { contenidoId, aFavor } = c.req.valid("json");
  const resultado = await new ContenidoService(c.get("db")).reaccionar(session.usuarioId, contenidoId, aFavor);
  return c.json(resultado);
});

/** Detalle de una tarjeta. */
contenidoRoutes.get("/:id", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const tarjeta = await new ContenidoService(c.get("db")).porId(c.req.param("id"), session.usuarioId);
  return c.json({ tarjeta });
});

/** Editar la propia publicación. */
contenidoRoutes.patch("/:id", requireRole(), validarJson(editarSchema), async (c) => {
  const session = c.get("session")!;
  const d = c.req.valid("json");
  const fila = await new ContenidoService(c.get("db")).editar(c.req.param("id"), session.usuarioId, {
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
  const r = await new ContenidoService(c.get("db")).eliminar(c.req.param("id"), session.usuarioId);
  return c.json(r);
});

/** Hilo de comentarios de una tarjeta. */
contenidoRoutes.get("/:id/comentarios", requireSesion(), async (c) => {
  const session = c.get("session")!;
  const comentarios = await new ContenidoService(c.get("db")).comentarios(c.req.param("id"), session.usuarioId);
  return c.json({ comentarios });
});

/** Comentar en una tarjeta (o responder, con padreId). */
contenidoRoutes.post("/:id/comentarios", requireRole(), validarJson(comentarSchema), async (c) => {
  const session = c.get("session")!;
  const { cuerpo, padreId } = c.req.valid("json");
  const comentario = await new ContenidoService(c.get("db")).comentar({
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
  const fila = await new ContenidoService(c.get("db")).editarComentario(
    c.req.param("cid"),
    session.usuarioId,
    c.req.valid("json").cuerpo,
  );
  return c.json(fila);
});

/** Borrar el propio comentario. */
contenidoRoutes.delete("/:id/comentarios/:cid", requireRole(), async (c) => {
  const session = c.get("session")!;
  const r = await new ContenidoService(c.get("db")).eliminarComentario(c.req.param("cid"), session.usuarioId);
  return c.json(r);
});

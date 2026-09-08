import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../../env";
import { requireRole, requireSesion } from "../../../shared/auth/middleware";
import { validarJson } from "../../../shared/http/validate";
import { ContenidoService } from "../core/contenido.service";
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
  const cursorScore = c.req.query("cursorScore");
  const cursorId = c.req.query("cursorId");
  const cursor = cursorScore && cursorId ? { score: Number(cursorScore), id: cursorId } : undefined;
  const tarjetas = await new ContenidoService(c.get("db")).feed({ usuarioId: session.usuarioId, tipo, cursor });
  return c.json({ tarjetas });
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

/** Hilo de comentarios de una tarjeta. */
contenidoRoutes.get("/:id/comentarios", requireSesion(), async (c) => {
  const comentarios = await new ContenidoService(c.get("db")).comentarios(c.req.param("id"));
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

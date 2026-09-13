import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../../../env";
import { requireRole, requireSesion } from "../../../shared/auth/middleware";
import { validarJson, validarParam } from "../../../shared/http/validate";
import { AppError } from "../../../shared/http/error";
import { crearDenuncia } from "../application/crear-denuncia";
import { confirmarTestigo } from "../application/confirmar-testigo";
import { categoriasDenuncia } from "../schema";

export const denunciasRoutes = new Hono<AppEnv>();

// NOTA: módulo de Fase 3. Requiere revisión previa manual del equipo antes
// de que cada denuncia pase de `en_revision` a `visible`.

denunciasRoutes.get("/categorias", requireSesion(), async (c) => {
  const filas = await c
    .get("db")
    .select({ id: categoriasDenuncia.id, nombre: categoriasDenuncia.nombre })
    .from(categoriasDenuncia)
    .where(eq(categoriasDenuncia.activo, true));
  return c.json({ categorias: filas });
});

const crearSchema = z.object({
  categoriaId: z.string().uuid(),
  texto: z.string().min(20).max(4000),
  esAnonimo: z.boolean().default(false),
});

denunciasRoutes.post("/", requireRole(), validarJson(crearSchema), async (c) => {
  const session = c.get("session")!;
  const { categoriaId, texto, esAnonimo } = c.req.valid("json");
  const contenido = await crearDenuncia(c.get("db"), {
    autorId: session.usuarioId,
    categoriaId,
    texto,
    esAnonimo,
    esCuentaOficial: session.esCuentaOficial,
    moderacion: {
      huggingfaceKey: c.env.HUGGINGFACE_API_KEY,
      modeloMlUrl: c.env.MODELO_ML_URL,
      modeloMlToken: c.env.MODELO_ML_TOKEN,
    },
  });
  return c.json({ id: contenido.id }, 201);
});

const idParamSchema = z.object({ id: z.string().uuid() });

denunciasRoutes.post("/:id/confirmar", requireRole(), validarParam(idParamSchema), async (c) => {
  const session = c.get("session")!;
  const resultado = await confirmarTestigo(c.get("db"), c.req.param("id"), session.usuarioId);
  return c.json(resultado);
});

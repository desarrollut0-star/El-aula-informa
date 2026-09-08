import { Hono } from "hono";
import type { AppEnv, Bindings } from "./env";
import { createDb } from "./shared/db/client";
import { resolverSesion } from "./shared/auth/session";
import { corsMiddleware } from "./shared/http/cors";
import { manejarError } from "./shared/http/error";
import type { AppModule } from "./modules/module";

import { identidadModule } from "./modules/identidad/identidad.module";
import { firmasModule } from "./modules/firmas/firmas.module";
import { contenidoModule } from "./modules/contenido/contenido.module";
import { denunciasModule } from "./modules/denuncias/denuncias.module";
import { moderacionModule } from "./modules/moderacion/moderacion.module";
import { notificacionesModule } from "./modules/notificaciones/notificaciones.module";

/** Orden sin importancia: los módulos no dependen entre sí, solo de eventos. */
export const modulos: AppModule[] = [
  identidadModule,
  firmasModule,
  contenidoModule,
  denunciasModule,
  moderacionModule,
  notificacionesModule,
];

const app = new Hono<AppEnv>();

app.use("*", corsMiddleware());

// Una conexión (pooler de Supabase) y la sesión resuelta por petición.
app.use("*", async (c, next) => {
  const db = createDb(c.env);
  c.set("db", db);
  c.set("session", await resolverSesion(c, db));
  await next();
});

app.onError(manejarError);

app.get("/salud", (c) => c.json({ ok: true }));

for (const modulo of modulos) {
  modulo.registerRoutes(app);
}

export default {
  fetch: app.fetch,
  scheduled: async (controller: ScheduledController, env: Bindings, ctx: ExecutionContext) => {
    const { procesarScheduled } = await import("./scheduler");
    ctx.waitUntil(procesarScheduled(controller, env));
  },
} satisfies ExportedHandler<Bindings>;

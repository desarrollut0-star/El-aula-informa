import type { AppModule } from "../module";
import { contenidoRoutes } from "./api/contenido.routes";
import { ContenidoRepository } from "./core/contenido.repository";

export const contenidoModule: AppModule = {
  slug: "/contenido",
  registerRoutes(app) {
    app.route("/contenido", contenidoRoutes);
  },
  eventHandlers: {
    /** Reportado por la comunidad N veces (ver moderacion-module). */
    async ContenidoReportadoNVeces(payload, { db }) {
      if (payload.objetivo !== "contenido") return;
      await new ContenidoRepository(db).ocultar(payload.objetivoId);
    },
    /** Rechazado por el filtro automático al publicarse. */
    async ContenidoFiltradoAutomaticamente(payload, { db }) {
      await new ContenidoRepository(db).ocultar(payload.contenidoId);
    },
  },
};

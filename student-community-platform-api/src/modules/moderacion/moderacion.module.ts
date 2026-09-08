import type { AppModule } from "../module";
import { moderacionRoutes } from "./api/moderacion.routes";
import { ModeracionService } from "./core/moderacion.service";
import { publish } from "../../shared/events/bus";

export const moderacionModule: AppModule = {
  slug: "/moderacion",
  registerRoutes(app) {
    app.route("/moderacion", moderacionRoutes);
  },
  eventHandlers: {
    /**
     * Pasa cada contenido nuevo por el filtro automático. Si no pasa,
     * publica el veredicto — es `contenido` quien lo oculta (dueño del dato).
     */
    async ContenidoPublicado(payload, { db }) {
      const servicio = new ModeracionService(db);
      const resultado = await servicio.revisarTextoAutomatico(payload.cuerpo);
      if (resultado.aprobado) return;
      await servicio.registrarAccion(
        payload.contenidoId,
        null,
        "ocultado_automatico",
        resultado.motivo ?? "filtro_automatico",
      );
      await publish(db, {
        type: "ContenidoFiltradoAutomaticamente",
        payload: { contenidoId: payload.contenidoId, motivo: resultado.motivo ?? "" },
      });
    },
  },
};

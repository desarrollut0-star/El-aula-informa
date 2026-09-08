import type { AppModule } from "../module";
import { notificacionesRoutes } from "./api/notificaciones.routes";
import { NotificacionesService } from "./core/notificaciones.service";

export const notificacionesModule: AppModule = {
  slug: "/notificaciones",
  registerRoutes(app) {
    app.route("/notificaciones", notificacionesRoutes);
  },
  eventHandlers: {
    async DenunciaAlcanzoUmbral(payload, { db }) {
      await new NotificacionesService(db).crear(
        payload.autorId,
        "denuncia_verificada",
        `Tu denuncia fue confirmada por ${payload.confirmaciones} alumnos y ya no aparece como "sin confirmar".`,
        payload.contenidoId,
      );
    },
    async AlumnoDadoDeBaja(payload, { db }) {
      await new NotificacionesService(db).crear(
        payload.usuarioId,
        "cuenta_dada_de_baja",
        "Tu cuenta pasó a solo lectura porque ya no apareces como inscrito activo.",
      );
    },
  },
};

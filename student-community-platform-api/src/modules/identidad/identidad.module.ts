import type { AppModule } from "../module";
import { identidadRoutes } from "./api/identidad.routes";

export const identidadModule: AppModule = {
  slug: "/identidad",
  registerRoutes(app) {
    app.route("/identidad", identidadRoutes);
  },
  // No escucha eventos de otros módulos por ahora: es el origen de
  // AlumnoDadoDeBaja / AlumnoReactivado, no un consumidor.
};

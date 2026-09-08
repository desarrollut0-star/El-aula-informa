import type { AppModule } from "../module";
import { denunciasRoutes } from "./api/denuncias.routes";

export const denunciasModule: AppModule = {
  slug: "/denuncias",
  registerRoutes(app) {
    app.route("/denuncias", denunciasRoutes);
  },
};

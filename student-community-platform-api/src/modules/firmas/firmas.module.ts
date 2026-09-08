import type { AppModule } from "../module";
import { firmasRoutes } from "./api/firmas.routes";

export const firmasModule: AppModule = {
  slug: "/firmas",
  registerRoutes(app) {
    app.route("/firmas", firmasRoutes);
  },
};

/**
 * Catálogo de eventos de integración. Añadir un evento aquí es lo único
 * necesario para que TypeScript exija su payload tanto al publicarlo
 * (bus.publish) como al escucharlo (AppModule.eventHandlers).
 */
export type IntegrationEvent =
  | { type: "FirmaRegistrada"; payload: { usuarioId: string; programaId: string } }
  | { type: "ContenidoPublicado"; payload: { contenidoId: string; tipo: string; cuerpo: string } }
  | {
      type: "ContenidoReportadoNVeces";
      payload: { objetivo: "contenido" | "comentario"; objetivoId: string; reportes: number };
    }
  | {
      type: "ContenidoFiltradoAutomaticamente";
      payload: { contenidoId: string; motivo: string };
    }
  | { type: "DenunciaAlcanzoUmbral"; payload: { contenidoId: string; autorId: string; confirmaciones: number } }
  | { type: "AlumnoDadoDeBaja"; payload: { usuarioId: string } }
  | { type: "AlumnoReactivado"; payload: { usuarioId: string } };

export type IntegrationEventType = IntegrationEvent["type"];

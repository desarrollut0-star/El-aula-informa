import type { Hono } from "hono";
import type { AppEnv } from "../env";
import type { Db } from "../shared/db/client";
import type { Bindings } from "../env";
import type { IntegrationEvent } from "../shared/events/types";

/** Contexto que reciben los manejadores de eventos de un módulo. */
export interface ModuleContext {
  db: Db;
  env: Bindings;
}

/**
 * Contrato que implementa cada módulo. src/index.ts recorre la lista de
 * módulos, monta sus rutas y registra sus manejadores de eventos ante el
 * dispatcher del outbox (ver src/shared/events/dispatcher.ts).
 *
 * Un módulo NUNCA importa código de otro módulo directamente: solo se
 * comunican por eventos de integración o llamando a su API HTTP.
 */
export interface AppModule {
  /** prefijo de ruta del módulo, p. ej. "/firmas" */
  readonly slug: string;

  /** registra las rutas del módulo en la app compartida */
  registerRoutes(app: Hono<AppEnv>): void;

  /** eventos de integración a los que reacciona este módulo (opcional) */
  readonly eventHandlers?: Partial<{
    [K in IntegrationEvent["type"]]: (
      payload: Extract<IntegrationEvent, { type: K }>["payload"],
      ctx: ModuleContext,
    ) => Promise<void>;
  }>;
}

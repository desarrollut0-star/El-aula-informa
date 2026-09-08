import { Rol } from "./rol";

export type EstatusPadron = "activo" | "baja";

/**
 * Regla de dominio del módulo: el rol se deriva del estatus en el padrón,
 * nunca se asigna a mano. La usa la reconciliación periódica
 * (src/scheduler/jobs/reconciliar-padron.ts).
 */
export function rolSegunPadron(estatus: EstatusPadron): Rol {
  return estatus === "activo" ? Rol.Verificado : Rol.NoVerificado;
}

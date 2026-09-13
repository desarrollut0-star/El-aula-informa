/**
 * Aviso ligero entre la campana del header y la página de notificaciones:
 * cuando una marca algo como leído, la otra se actualiza sin recargar.
 */
export const EVENTO_NOTIFICACIONES = "aula:notificaciones";

export function avisarCambioNotificaciones() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));
}

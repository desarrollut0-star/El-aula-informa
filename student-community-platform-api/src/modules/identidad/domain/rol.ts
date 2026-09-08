/**
 * Solo dos roles (ver sección 6 del documento de arquitectura). No hay
 * moderador, representante ni admin como rol dentro de la app: esas
 * funciones se reparten entre la cuenta «Sociedad Estudiantil», los
 * automatismos de moderación y el acceso de infraestructura del equipo.
 */
export enum Rol {
  NoVerificado = "no_verificado",
  Verificado = "verificado",
}

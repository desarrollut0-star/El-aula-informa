export const UMBRAL_CONFIRMACIONES = 5;

/**
 * Regla de negocio del módulo: cuándo una denuncia deja de estar "sin
 * confirmar". El texto, el autor y `es_anonimo` viven en `contenidos`;
 * aquí solo el estado de verificación por testigos.
 */
export class Denuncia {
  constructor(
    public readonly contenidoId: string,
    public readonly autorId: string,
    public noVerificada: boolean,
    public confirmaciones: number,
  ) {}

  /** true si esta confirmación cruza el umbral. */
  registrarConfirmacion(): boolean {
    this.confirmaciones += 1;
    if (this.noVerificada && this.confirmaciones >= UMBRAL_CONFIRMACIONES) {
      this.noVerificada = false;
      return true;
    }
    return false;
  }
}

/**
 * Fórmula de ranking del muro (sección 14.5 del documento de arquitectura).
 * Pública y auditable: cualquiera puede ver por qué una tarjeta está
 * arriba. Fase 1, sin ML — el ML se añade después como asistente, nunca
 * como el único criterio de orden.
 */

export type Nivel = "bajo" | "medio" | "alto";

const PESO_NIVEL: Record<Nivel, number> = { bajo: 1, medio: 1.4, alto: 1.8 };

/** Decaimiento tipo "hot" de Reddit: pierde peso con el tiempo, nunca a cero de golpe. */
function decaimiento(horasDesdePublicacion: number): number {
  return 1 / Math.pow(horasDesdePublicacion + 2, 1.5);
}

export interface DatosParaScore {
  reaccionesAFavor: number;
  publicadoEn: Date;
  nivel: Nivel;
  confirmacionesTestigos?: number;
  ahora?: Date;
}

export function calcularScore({
  reaccionesAFavor,
  publicadoEn,
  nivel,
  confirmacionesTestigos = 0,
  ahora = new Date(),
}: DatosParaScore): number {
  const horas = Math.max(0, (ahora.getTime() - publicadoEn.getTime()) / 36e5);
  const base = reaccionesAFavor + confirmacionesTestigos * 2;
  return base * PESO_NIVEL[nivel] * decaimiento(horas);
}

import { describe, expect, it } from "vitest";
import { calcularScore } from "../src/shared/ranking/score";

describe("calcularScore (sección 14.5 del documento de arquitectura)", () => {
  const ahora = new Date("2026-09-10T12:00:00Z");

  it("un testimonio con más reacciones puntúa más alto a igualdad de lo demás", () => {
    const pocasReacciones = calcularScore({
      reaccionesAFavor: 5,
      nivel: "medio",
      publicadoEn: ahora,
      ahora,
    });
    const muchasReacciones = calcularScore({
      reaccionesAFavor: 50,
      nivel: "medio",
      publicadoEn: ahora,
      ahora,
    });

    expect(muchasReacciones).toBeGreaterThan(pocasReacciones);
  });

  it("el nivel Alto pesa más que Bajo con las mismas reacciones", () => {
    const bajo = calcularScore({ reaccionesAFavor: 10, nivel: "bajo", publicadoEn: ahora, ahora });
    const alto = calcularScore({ reaccionesAFavor: 10, nivel: "alto", publicadoEn: ahora, ahora });

    expect(alto).toBeGreaterThan(bajo);
  });

  it("el score decae con el tiempo (un aviso viejo no tapa lo vigente)", () => {
    const hace1Hora = new Date(ahora.getTime() - 1 * 36e5);
    const hace48Horas = new Date(ahora.getTime() - 48 * 36e5);

    const reciente = calcularScore({ reaccionesAFavor: 20, nivel: "medio", publicadoEn: hace1Hora, ahora });
    const viejo = calcularScore({ reaccionesAFavor: 20, nivel: "medio", publicadoEn: hace48Horas, ahora });

    expect(reciente).toBeGreaterThan(viejo);
  });

  it("las confirmaciones de testigos suman al score de una denuncia", () => {
    const sinTestigos = calcularScore({ reaccionesAFavor: 10, nivel: "alto", publicadoEn: ahora, ahora });
    const conTestigos = calcularScore({
      reaccionesAFavor: 10,
      nivel: "alto",
      publicadoEn: ahora,
      confirmacionesTestigos: 8,
      ahora,
    });

    expect(conTestigos).toBeGreaterThan(sinTestigos);
  });
});

"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";

interface Props {
  objetivo: "contenido" | "comentario";
  objetivoId: string;
}

/**
 * Botón «reportar» en cada tarjeta/comentario. Al llegar a N reportes,
 * moderación oculta el contenido automáticamente (ver ContenidoReportadoNVeces).
 */
export function BotonReportar({ objetivo, objetivoId }: Props) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "listo" | "error">("idle");

  async function reportar() {
    setEstado("enviando");
    try {
      await api.reportar(objetivo, objetivoId, "ofensivo");
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "listo") return <span className="text-xs text-tinta-suave">Reportado</span>;

  return (
    <button
      type="button"
      onClick={reportar}
      disabled={estado === "enviando"}
      className="text-xs text-tinta-suave underline decoration-dotted hover:text-terracota disabled:opacity-50"
    >
      {estado === "enviando" ? "Reportando…" : estado === "error" ? "Reintenta" : "Reportar"}
    </button>
  );
}

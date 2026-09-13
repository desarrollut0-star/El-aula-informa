"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Icono } from "./Iconos";

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

  if (estado === "listo") {
    return (
      <span className="inline-flex animate-aparecer-suave items-center gap-1 px-2.5 py-1.5 text-xs text-tinta-suave">
        <Icono nombre="check" className="h-3.5 w-3.5 text-verde" grosor={2.4} />
        Reportado
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={reportar}
      disabled={estado === "enviando"}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-tinta-suave transition-colors hover:bg-terracota-tenue hover:text-terracota disabled:opacity-50"
    >
      <Icono nombre="bandera" className="h-3.5 w-3.5" />
      {estado === "enviando" ? "Reportando…" : estado === "error" ? "Reintenta" : "Reportar"}
    </button>
  );
}

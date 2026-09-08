"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { PuertaSesion } from "@/components/auth/PuertaSesion";

/**
 * Cascarón: búsqueda. La base ya tiene el índice de texto completo
 * (`contenidos.busqueda`, tsvector en español). Falta el endpoint
 * `GET /contenido/buscar?q=`.
 */
export default function Buscar() {
  const [q, setQ] = useState("");

  return (
    <PuertaSesion titulo="Buscar en la comunidad">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">Buscar</h1>
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca en testimonios, avisos, propuestas…"
            className="flex-1 border border-borde bg-blanco-papel px-3 py-2"
          />
          <Boton type="submit">Buscar</Boton>
        </form>
        <p className="text-sm text-tinta-suave">La búsqueda llega pronto.</p>
      </div>
    </PuertaSesion>
  );
}

"use client";

import { useState } from "react";
import type { TarjetaContenido as Tarjeta } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { NivelPill } from "@/components/ui/NivelPill";
import { Boton } from "@/components/ui/Boton";
import { AvatarAlias } from "./AvatarAlias";

/**
 * Vista de acción (celular): deslizar es un atajo, el botón SIEMPRE existe
 * como respaldo (accesibilidad + laptop). El swipe usa puntero nativo para
 * no depender de una librería.
 */
export function SwiperDeck({ tarjetasIniciales }: { tarjetasIniciales: Tarjeta[] }) {
  const [tarjetas, setTarjetas] = useState(tarjetasIniciales);
  const [arrastreX, setArrastreX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const actual = tarjetas[0];

  async function reaccionar(aFavor: boolean) {
    if (!actual) return;
    setTarjetas((prev) => prev.slice(1));
    setArrastreX(0);
    try {
      await api.reaccionar(actual.id, aFavor);
    } catch {
      /* silencioso: no se bloquea el swipe por un fallo de red puntual */
    }
  }

  if (!actual) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center text-tinta-suave">
        <p>Por ahora no hay más testimonios para calificar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-full max-w-sm touch-none select-none border border-borde bg-blanco-papel p-6 shadow-sm"
        style={{ transform: `translateX(${arrastreX}px) rotate(${arrastreX / 18}deg)` }}
        onPointerDown={(e) => {
          setArrastrando(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => arrastrando && setArrastreX((x) => x + e.movementX)}
        onPointerUp={() => {
          setArrastrando(false);
          if (arrastreX > 100) void reaccionar(true);
          else if (arrastreX < -100) void reaccionar(false);
          else setArrastreX(0);
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <AvatarAlias
            alias={actual.autorAlias}
            anonimo={actual.esAnonimo || !actual.autorAlias}
            oficial={actual.autorOficial}
            size={32}
          />
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-semibold text-verde-oscuro">
              {actual.esAnonimo || !actual.autorAlias ? "Anónimo" : actual.autorAlias}
            </div>
            {!actual.esAnonimo && actual.autorPrograma && (
              <div className="truncate text-tinta-suave">{actual.autorPrograma}</div>
            )}
          </div>
          <NivelPill nivel={actual.nivel} />
        </div>
        <p className="text-lg italic leading-snug">“{actual.cuerpo}”</p>
      </div>

      <div className="flex gap-4">
        <Boton variante="secundario" onClick={() => reaccionar(false)}>
          ⬅ No me identifico
        </Boton>
        <Boton variante="primario" onClick={() => reaccionar(true)}>
          A mí también me afecta ➡
        </Boton>
      </div>
    </div>
  );
}

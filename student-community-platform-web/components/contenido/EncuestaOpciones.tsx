"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { Icono } from "@/components/ui/Iconos";
import type { OpcionEncuesta } from "@/lib/tipos";

/**
 * Opciones de una encuesta dentro de la tarjeta del muro. Se cargan aparte
 * (no vienen en el feed) porque son 2-6 filas extra por tarjeta y solo
 * hacen falta cuando el tipo es "encuesta".
 */
export function EncuestaOpciones({ contenidoId, cerrada }: { contenidoId: string; cerrada: boolean }) {
  const { puedeInteractuar } = useSesion();
  const [opciones, setOpciones] = useState<OpcionEncuesta[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    api
      .opcionesEncuesta(contenidoId)
      .then((r) => vivo && setOpciones(r.opciones))
      .catch(() => vivo && setOpciones([]));
    return () => {
      vivo = false;
    };
  }, [contenidoId]);

  async function votar(opcionId: string) {
    if (ocupado || !puedeInteractuar || cerrada) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await api.votar(contenidoId, opcionId);
      setOpciones(r.opciones);
    } catch {
      setError("No se pudo registrar tu voto. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  if (!opciones) {
    return <div className="mt-3 h-20 animate-pulse rounded-xl bg-papel-alt/60" />;
  }

  const total = opciones.reduce((n, o) => n + o.totalVotos, 0);
  const yaVote = opciones.some((o) => o.miVoto);
  const mostrarResultado = yaVote || cerrada;

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {opciones.map((o) => {
        const pct = total > 0 ? Math.round((o.totalVotos / total) * 100) : 0;
        return (
          <button
            key={o.id}
            type="button"
            disabled={ocupado || !puedeInteractuar || cerrada}
            onClick={() => votar(o.id)}
            className={`relative overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-90 ${
              o.miVoto ? "border-verde bg-verde-tenue/40" : "border-borde bg-blanco-papel hover:border-verde-linea"
            }`}
          >
            {mostrarResultado && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-verde-tenue transition-[width] duration-500 ease-suave"
                style={{ width: `${pct}%`, zIndex: 0 }}
              />
            )}
            <span className="relative z-[1] flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-tinta">
                {o.miVoto && <Icono nombre="check" className="h-4 w-4 shrink-0 text-verde-oscuro" />}
                {o.texto}
              </span>
              {mostrarResultado && (
                <span className="shrink-0 text-xs tabular-nums text-tinta-suave">
                  {pct}% · {o.totalVotos}
                </span>
              )}
            </span>
          </button>
        );
      })}
      {error && <p className="text-xs text-terracota">{error}</p>}
      {!puedeInteractuar && !cerrada && (
        <p className="text-[11px] text-tinta-suave">Inicia sesión con tu cuenta verificada para votar.</p>
      )}
      {cerrada && <p className="text-[11px] text-tinta-suave">Esta encuesta ya cerró.</p>}
    </div>
  );
}

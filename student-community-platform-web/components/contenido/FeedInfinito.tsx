"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TarjetaContenido as Tarjeta, TipoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { etiquetaDia } from "@/lib/fechas";
import { EsqueletoTarjeta } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Iconos";
import { TarjetaContenido } from "./TarjetaContenido";

/**
 * Scroll infinito del muro. Orden cronológico (más reciente primero),
 * paginación por cursor (creado_en, id) y agrupado por día para que el
 * muro siga siendo legible cuando haya muchas publicaciones.
 */
export function FeedInfinito({
  tarjetasIniciales,
  tipo,
}: {
  tarjetasIniciales: Tarjeta[];
  tipo?: TipoContenido;
}) {
  const [tarjetas, setTarjetas] = useState(tarjetasIniciales);
  const [cargando, setCargando] = useState(false);
  const [agotado, setAgotado] = useState(tarjetasIniciales.length === 0);
  const centinela = useRef<HTMLDivElement>(null);

  const cargarMas = useCallback(async () => {
    if (cargando || agotado) return;
    setCargando(true);
    const ultima = tarjetas[tarjetas.length - 1];
    const { tarjetas: nuevas } = await api
      .feed({ tipo, cursor: ultima ? { fecha: ultima.creadoEn, id: ultima.id } : undefined })
      .catch(() => ({ tarjetas: [] as Tarjeta[] }));
    if (nuevas.length === 0) setAgotado(true);
    else setTarjetas((prev) => [...prev, ...nuevas.filter((n) => !prev.some((p) => p.id === n.id))]);
    setCargando(false);
  }, [tarjetas, cargando, agotado, tipo]);

  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo) return;
    const obs = new IntersectionObserver((e) => e[0]?.isIntersecting && cargarMas(), { rootMargin: "400px" });
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [cargarMas]);

  function quitar(id: string) {
    setTarjetas((prev) => prev.filter((t) => t.id !== id));
  }

  if (tarjetas.length === 0) {
    return (
      <div className="tarjeta flex animate-aparecer flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-verde-tenue text-verde-oscuro">
          <Icono nombre="lista" className="h-5 w-5" />
        </span>
        <p className="font-semibold text-verde-oscuro">Todavía no hay publicaciones</p>
        <p className="text-sm text-tinta-suave">Cuando la comunidad publique algo, aparecerá aquí.</p>
      </div>
    );
  }

  // Agrupar por día conservando el orden.
  const grupos: { dia: string; items: Tarjeta[] }[] = [];
  for (const t of tarjetas) {
    const dia = etiquetaDia(t.creadoEn);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.items.push(t);
    else grupos.push({ dia, items: [t] });
  }

  return (
    <div className="flex flex-col gap-8">
      {grupos.map((g) => (
        <section key={g.dia + g.items[0]!.id} className="flex flex-col gap-4">
          <div className="pointer-events-none sticky top-[calc(var(--alto-header)+0.5rem)] z-10 flex justify-center">
            <h3 className="rounded-full border border-borde/70 bg-papel/90 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-tinta-suave shadow-tarjeta backdrop-blur-sm">
              {g.dia}
            </h3>
          </div>
          {g.items.map((t, i) => (
            <div key={t.id} className="animate-aparecer" style={{ animationDelay: `${Math.min(i, 4) * 45}ms` }}>
              <TarjetaContenido tarjeta={t} onEliminada={quitar} />
            </div>
          ))}
        </section>
      ))}

      <div ref={centinela} aria-live="polite">
        {cargando ? (
          <EsqueletoTarjeta />
        ) : agotado ? (
          <div className="flex items-center gap-3 py-2 text-xs text-tinta-suave">
            <span className="h-px flex-1 bg-borde" />
            Estás al día
            <span className="h-px flex-1 bg-borde" />
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  );
}

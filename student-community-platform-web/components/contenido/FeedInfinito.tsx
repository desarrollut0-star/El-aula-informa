"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TarjetaContenido as Tarjeta, TipoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { etiquetaDia } from "@/lib/fechas";
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
    return <p className="text-tinta-suave">Todavía no hay publicaciones.</p>;
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
          <h3 className="sticky top-16 z-10 -mx-1 bg-papel/95 px-1 py-1 text-xs font-bold uppercase tracking-wide text-tinta-suave backdrop-blur">
            {g.dia}
          </h3>
          {g.items.map((t) => (
            <TarjetaContenido key={t.id} tarjeta={t} onEliminada={quitar} />
          ))}
        </section>
      ))}
      <div ref={centinela} className="py-4 text-center text-sm text-tinta-suave">
        {cargando ? "Cargando más…" : agotado ? "Ya viste todo." : ""}
      </div>
    </div>
  );
}

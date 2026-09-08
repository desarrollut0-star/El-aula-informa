"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TarjetaContenido as Tarjeta, TipoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { TarjetaContenido } from "./TarjetaContenido";

/**
 * Scroll infinito del muro (sección 14.6): paginación por cursor (score, id)
 * para que el feed no "salte" al llegar contenido nuevo mientras se scrollea.
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
      .feed({ tipo, cursor: ultima ? { score: ultima.score, id: ultima.id } : undefined })
      .catch(() => ({ tarjetas: [] as Tarjeta[] }));
    if (nuevas.length === 0) setAgotado(true);
    else setTarjetas((prev) => [...prev, ...nuevas]);
    setCargando(false);
  }, [tarjetas, cargando, agotado, tipo]);

  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo) return;
    const obs = new IntersectionObserver((e) => e[0]?.isIntersecting && cargarMas(), { rootMargin: "400px" });
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [cargarMas]);

  if (tarjetas.length === 0) {
    return <p className="text-tinta-suave">Todavía no hay publicaciones.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {tarjetas.map((t) => (
        <TarjetaContenido key={t.id} tarjeta={t} />
      ))}
      <div ref={centinela} className="py-4 text-center text-sm text-tinta-suave">
        {cargando ? "Cargando más…" : agotado ? "Ya viste todo." : ""}
      </div>
    </div>
  );
}

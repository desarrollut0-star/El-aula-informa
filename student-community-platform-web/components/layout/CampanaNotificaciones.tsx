"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Notificacion } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { EVENTO_NOTIFICACIONES, avisarCambioNotificaciones } from "@/lib/notificaciones";
import { Icono } from "@/components/ui/Iconos";
import { EsqueletoNotificaciones, ItemNotificacion } from "@/components/notificaciones/ItemNotificacion";

/** Cada cuánto se revisa el contador mientras la pestaña está a la vista. */
const CADA_MS = 60_000;
const RECIENTES = 6;

/**
 * Campana del header con contador de no leídas y un panel con las más
 * recientes. Solo pide el contador (una consulta mínima) y carga la lista
 * al abrir el panel.
 */
export function CampanaNotificaciones() {
  const pathname = usePathname() ?? "/";
  const [total, setTotal] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState<Notificacion[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const contar = useCallback(async () => {
    try {
      const r = await api.notificacionesNoLeidas();
      setTotal(r.total);
    } catch {
      /* sin conexión: se conserva el último valor */
    }
  }, []);

  useEffect(() => {
    void contar();
    const alCambio = () => void contar();
    const alVolver = () => {
      if (document.visibilityState === "visible") void contar();
    };
    const iv = setInterval(alVolver, CADA_MS);
    window.addEventListener(EVENTO_NOTIFICACIONES, alCambio);
    window.addEventListener("focus", alCambio);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(iv);
      window.removeEventListener(EVENTO_NOTIFICACIONES, alCambio);
      window.removeEventListener("focus", alCambio);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [contar]);

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  async function alternar() {
    const abrir = !abierto;
    setAbierto(abrir);
    if (!abrir) return;
    try {
      const r = await api.notificaciones();
      setLista(r.notificaciones.slice(0, RECIENTES));
    } catch {
      setLista((prev) => prev ?? []);
    }
  }

  async function abrirNotificacion(n: Notificacion) {
    setAbierto(false);
    if (n.leidaEn) return;
    const ahora = new Date().toISOString();
    setLista((prev) => prev?.map((x) => (x.id === n.id ? { ...x, leidaEn: ahora } : x)) ?? prev);
    setTotal((t) => Math.max(0, t - 1));
    try {
      await api.marcarNotificacionLeida(n.id);
    } catch {
      /* el contador se corrige al avisar */
    } finally {
      avisarCambioNotificaciones();
    }
  }

  async function marcarTodas() {
    const ahora = new Date().toISOString();
    setLista((prev) => prev?.map((x) => (x.leidaEn ? x : { ...x, leidaEn: ahora })) ?? prev);
    setTotal(0);
    try {
      await api.marcarTodasLeidas();
    } catch {
      /* el contador se corrige al avisar */
    } finally {
      avisarCambioNotificaciones();
    }
  }

  const etiqueta = total > 9 ? "9+" : String(total);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        aria-label={total > 0 ? `Notificaciones, ${total} sin leer` : "Notificaciones"}
        title="Notificaciones"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 ${
          abierto ? "bg-verde/60 text-blanco-papel" : "text-blanco-papel/85 hover:bg-verde/40 hover:text-blanco-papel"
        }`}
      >
        <Icono nombre="campana" className="h-5 w-5" />
        {total > 0 && (
          <span
            key={etiqueta}
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] animate-menu items-center justify-center rounded-full bg-ocre px-1 text-[10px] font-bold leading-none text-blanco-papel ring-2 ring-verde-oscuro"
          >
            {etiqueta}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones recientes"
          className="z-50 animate-menu overflow-hidden rounded-2xl border border-borde/80 bg-blanco-papel text-tinta shadow-flotante max-md:fixed max-md:inset-x-3 max-md:top-[3.75rem] md:absolute md:right-0 md:top-full md:mt-2 md:w-[22rem] md:origin-top-right"
        >
          <div className="flex items-center justify-between gap-2 border-b border-borde/70 px-4 py-3">
            <p className="font-display text-lg font-bold text-verde-oscuro">Notificaciones</p>
            {total > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-verde transition-colors hover:bg-verde-tenue"
              >
                <Icono nombre="check" className="h-3.5 w-3.5" grosor={2.4} />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {lista === null ? (
              <EsqueletoNotificaciones />
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-verde-tenue text-verde-oscuro">
                  <Icono nombre="campana" className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-verde-oscuro">Estás al día</p>
                <p className="text-xs text-tinta-suave">Aquí te avisaremos de lo que pase con tu cuenta y tus publicaciones.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5 p-1.5">
                {lista.map((n) => (
                  <li key={n.id}>
                    <ItemNotificacion n={n} compacto onAbrir={abrirNotificacion} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/notificaciones"
            onClick={() => setAbierto(false)}
            className="group flex items-center justify-center gap-1 border-t border-borde/70 px-4 py-2.5 text-sm font-semibold text-verde transition-colors hover:bg-papel-alt/70"
          >
            Ver todas
            <Icono nombre="flechaDer" className="h-4 w-4 transition-transform duration-200 ease-suave group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

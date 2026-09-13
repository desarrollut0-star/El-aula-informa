"use client";

import { useCallback, useEffect, useState } from "react";
import type { Notificacion } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { etiquetaDia } from "@/lib/fechas";
import { EVENTO_NOTIFICACIONES, avisarCambioNotificaciones } from "@/lib/notificaciones";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { EsqueletoNotificaciones, ItemNotificacion } from "@/components/notificaciones/ItemNotificacion";
import { Icono } from "@/components/ui/Iconos";

/** El backend devuelve como máximo esta cantidad. */
const LIMITE = 50;

export default function Notificaciones() {
  return (
    <PuertaSesion titulo="Tus notificaciones">
      <Contenido />
    </PuertaSesion>
  );
}

function Contenido() {
  const [items, setItems] = useState<Notificacion[] | null>(null);
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await api.notificaciones();
      setItems(r.notificaciones);
    } catch {
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void cargar();
    // Si la campana del header marca algo como leído, esta lista se actualiza.
    const alCambio = () => void cargar();
    window.addEventListener(EVENTO_NOTIFICACIONES, alCambio);
    return () => window.removeEventListener(EVENTO_NOTIFICACIONES, alCambio);
  }, [cargar]);

  async function abrir(n: Notificacion) {
    if (n.leidaEn) return;
    const ahora = new Date().toISOString();
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, leidaEn: ahora } : x)) ?? prev);
    try {
      await api.marcarNotificacionLeida(n.id);
    } catch {
      /* la lista se corrige al recargar */
    } finally {
      avisarCambioNotificaciones();
    }
  }

  async function marcarTodas() {
    setMarcando(true);
    const ahora = new Date().toISOString();
    setItems((prev) => prev?.map((x) => (x.leidaEn ? x : { ...x, leidaEn: ahora })) ?? prev);
    try {
      await api.marcarTodasLeidas();
    } catch {
      /* la lista se corrige al recargar */
    } finally {
      setMarcando(false);
      avisarCambioNotificaciones();
    }
  }

  const lista = items ?? [];
  const noLeidas = lista.filter((n) => !n.leidaEn).length;

  // Agrupar por día conservando el orden (más recientes primero).
  const grupos: { dia: string; items: Notificacion[] }[] = [];
  for (const n of lista) {
    const dia = etiquetaDia(n.creadoEn);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.items.push(n);
    else grupos.push({ dia, items: [n] });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Notificaciones</h1>
          <p className="mt-1 min-h-5 text-sm text-tinta-suave">
            {items === null
              ? " "
              : noLeidas === 0
                ? "Estás al día."
                : `Tienes ${noLeidas} ${noLeidas === 1 ? "notificación sin leer" : "notificaciones sin leer"}.`}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            type="button"
            onClick={marcarTodas}
            disabled={marcando}
            className="inline-flex animate-aparecer-suave items-center gap-1.5 rounded-full border border-borde bg-blanco-papel px-3.5 py-1.5 text-sm font-semibold text-verde transition-colors duration-200 hover:border-verde-linea hover:bg-verde-tenue/60 disabled:opacity-60"
          >
            <Icono nombre="check" className="h-4 w-4" grosor={2.4} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {items === null ? (
        <div className="tarjeta">
          <EsqueletoNotificaciones filas={4} />
        </div>
      ) : lista.length === 0 ? (
        <div className="tarjeta flex animate-aparecer flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-verde-tenue text-verde-oscuro">
            <Icono nombre="campana" className="h-5 w-5" />
          </span>
          <p className="font-semibold text-verde-oscuro">No tienes notificaciones</p>
          <p className="max-w-sm text-sm text-tinta-suave">
            Aquí te avisaremos cuando pase algo con tu cuenta o con lo que publicas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <section key={g.dia + g.items[0]!.id} className="flex flex-col gap-2">
              <h2 className="px-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-tinta-suave">
                {g.dia}
              </h2>
              <ul className="tarjeta flex flex-col gap-0.5 p-1.5">
                {g.items.map((n, i) => (
                  <li key={n.id} className="animate-aparecer" style={{ animationDelay: `${Math.min(i, 5) * 35}ms` }}>
                    <ItemNotificacion n={n} onAbrir={abrir} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {lista.length >= LIMITE && (
            <p className="text-center text-xs text-tinta-suave">Se muestran tus {LIMITE} notificaciones más recientes.</p>
          )}
        </div>
      )}
    </div>
  );
}

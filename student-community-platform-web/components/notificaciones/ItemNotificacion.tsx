"use client";

import Link from "next/link";
import type { Notificacion } from "@/lib/tipos";
import { haceCuanto } from "@/lib/fechas";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

const ESTILOS: Record<string, { icono: NombreIcono; tono: string; titulo: string }> = {
  denuncia_verificada: { icono: "escudo", tono: "bg-verde-tenue text-verde-oscuro", titulo: "Reporte confirmado" },
  cuenta_dada_de_baja: { icono: "candado", tono: "bg-terracota-tenue text-terracota", titulo: "Cambio en tu cuenta" },
};
const PREDETERMINADO = { icono: "campana" as NombreIcono, tono: "bg-ocre-tenue text-ocre", titulo: "Aviso" };

/** Una notificación. Si tiene publicación relacionada, lleva a ella. */
export function ItemNotificacion({
  n,
  compacto = false,
  onAbrir,
}: {
  n: Notificacion;
  compacto?: boolean;
  onAbrir: (n: Notificacion) => void;
}) {
  const e = ESTILOS[n.tipo] ?? PREDETERMINADO;
  const noLeida = !n.leidaEn;

  const contenido = (
    <>
      <span
        className={`flex shrink-0 items-center justify-center rounded-full ${e.tono} ${compacto ? "h-9 w-9" : "h-10 w-10"}`}
      >
        <Icono nombre={e.icono} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-1.5">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wide ${noLeida ? "text-verde-oscuro" : "text-tinta-suave"}`}
          >
            {e.titulo}
          </span>
          <span aria-hidden className="text-xs text-tinta-suave">
            ·
          </span>
          <time dateTime={n.creadoEn} className="text-xs text-tinta-suave">
            {haceCuanto(n.creadoEn)}
          </time>
        </span>
        <span
          className={`mt-0.5 block text-sm leading-snug ${noLeida ? "text-tinta" : "text-tinta-suave"} ${
            compacto ? "line-clamp-2" : ""
          }`}
        >
          {noLeida && <span className="sr-only">No leída. </span>}
          {n.mensaje}
        </span>
      </span>
      <span
        aria-hidden
        className={`mt-2 h-2 w-2 shrink-0 rounded-full bg-verde transition-[opacity,transform] duration-300 ease-suave ${
          noLeida ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />
    </>
  );

  const clases = `flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 ${
    noLeida ? "bg-verde-tenue/35 hover:bg-verde-tenue/60" : "hover:bg-papel-alt/70"
  }`;

  if (n.contenidoId) {
    return (
      <Link href={`/contenido/${n.contenidoId}`} onClick={() => onAbrir(n)} className={clases}>
        {contenido}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onAbrir(n)} className={clases}>
      {contenido}
    </button>
  );
}

export function EsqueletoNotificaciones({ filas = 3 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-1 p-1.5" role="status">
      <span className="sr-only">Cargando notificaciones…</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3" aria-hidden>
          <div className="esqueleto h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="esqueleto h-2.5 w-28 rounded" />
            <div className="esqueleto h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

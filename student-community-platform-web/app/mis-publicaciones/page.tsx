"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MiPublicacion, EstadoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { haceCuanto } from "@/lib/fechas";

const ESTADO: Record<EstadoContenido, { txt: string; clase: string }> = {
  visible: { txt: "Publicada", clase: "border-verde text-verde-oscuro" },
  en_revision: { txt: "En revisión", clase: "border-ocre text-ocre" },
  oculto: { txt: "Oculta", clase: "border-tinta-suave text-tinta-suave" },
  rechazado: { txt: "Rechazada", clase: "border-terracota text-terracota" },
};

const ICONO: Record<string, string> = {
  testimonio: "🗣️", aviso: "📣", evento: "📅", novedad: "📰",
  propuesta: "💡", encuesta: "🗳️", denuncia: "📮",
};

export default function MisPublicaciones() {
  const [items, setItems] = useState<MiPublicacion[] | null>(null);

  useEffect(() => {
    api.misPublicaciones().then((r) => setItems(r.publicaciones)).catch(() => setItems([]));
  }, []);

  return (
    <PuertaSesion titulo="Mis publicaciones">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">Mis publicaciones</h1>
        {items === null ? (
          <p className="text-tinta-suave">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-tinta-suave">Todavía no has publicado nada.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((p) => {
              const est = ESTADO[p.estado];
              return (
                <li key={p.id}>
                  <Link
                    href={`/contenido/${p.id}`}
                    className="block border border-borde bg-blanco-papel p-4 hover:border-verde"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {ICONO[p.tipo] ?? "•"} {p.titulo ?? p.cuerpo.slice(0, 60)}
                        {p.esAnonimo && <span className="ml-2 text-xs text-tinta-suave">(anónima)</span>}
                      </span>
                      <span className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-bold uppercase ${est.clase}`}>
                        {est.txt}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-tinta-suave">{p.cuerpo}</p>
                    <div className="mt-2 flex gap-3 text-xs text-tinta-suave">
                      <span>👍 {p.totalApoyos}</span>
                      <span>👎 {p.totalRechazos}</span>
                      <span>💬 {p.totalComentarios}</span>
                      <span className="ml-auto">{haceCuanto(p.creadoEn)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PuertaSesion>
  );
}

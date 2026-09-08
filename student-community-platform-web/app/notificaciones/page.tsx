"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Notificacion } from "@/lib/tipos";
import { PuertaSesion } from "@/components/auth/PuertaSesion";

export default function Notificaciones() {
  return (
    <PuertaSesion titulo="Tus notificaciones">
      <Contenido />
    </PuertaSesion>
  );
}

function Contenido() {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.notificaciones()
      .then((r) => setItems(r.notificaciones))
      .catch(() => setItems([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">Notificaciones</h1>
      {cargando ? (
        <p className="text-tinta-suave">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-tinta-suave">No tienes notificaciones.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id} className="border border-borde bg-blanco-papel p-3 text-sm">
              <p>{n.mensaje}</p>
              <time className="text-xs text-tinta-suave">{new Date(n.creadoEn).toLocaleString("es-MX")}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

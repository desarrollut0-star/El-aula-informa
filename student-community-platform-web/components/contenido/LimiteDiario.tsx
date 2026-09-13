"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

/** Aviso de cuántas publicaciones quedan hoy. Se pone arriba de los formularios. */
export function LimiteDiario() {
  const [info, setInfo] = useState<{ restantes: number | null; limite: number | null } | null>(null);

  useEffect(() => {
    api.limitePublicaciones().then(setInfo).catch(() => setInfo(null));
  }, []);

  if (!info || info.restantes === null || info.limite === null) return null;

  if (info.restantes === 0) {
    return (
      <p className="animate-aparecer-suave rounded-xl border border-terracota/40 bg-terracota-tenue px-4 py-3 text-sm text-terracota">
        Ya publicaste {info.limite} veces en las últimas 24 horas. Podrás volver a publicar más tarde.
      </p>
    );
  }

  const barras = Math.min(info.limite, 10);

  return (
    <div className="flex animate-aparecer-suave flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-suave">
      <span className="flex gap-1" aria-hidden>
        {Array.from({ length: barras }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${
              i < (info.restantes ?? 0) ? "bg-verde" : "bg-borde"
            }`}
          />
        ))}
      </span>
      <span>
        Te quedan <strong className="text-tinta">{info.restantes}</strong> de {info.limite} publicaciones por hoy.
      </span>
    </div>
  );
}

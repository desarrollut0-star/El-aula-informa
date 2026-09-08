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
      <p className="border border-terracota bg-terracota-tenue p-3 text-sm text-terracota">
        Ya publicaste {info.limite} veces en las últimas 24 horas. Podrás volver a publicar más tarde.
      </p>
    );
  }

  return (
    <p className="text-xs text-tinta-suave">
      Te quedan <strong>{info.restantes}</strong> de {info.limite} publicaciones por hoy.
    </p>
  );
}

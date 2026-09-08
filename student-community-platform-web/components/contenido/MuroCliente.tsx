"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TarjetaContenido as Tarjeta, TipoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { FeedInfinito } from "./FeedInfinito";
import { Boton } from "@/components/ui/Boton";

/**
 * Muro cargado desde el cliente (con el token de sesión). Reemplaza el
 * fetch en el servidor, que ya no funciona porque el feed exige sesión.
 */
export function MuroCliente({
  tipo,
  accionHref,
  accionTexto,
}: {
  tipo?: TipoContenido;
  accionHref?: string;
  accionTexto?: string;
}) {
  const { puedeInteractuar } = useSesion();
  const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null);

  useEffect(() => {
    let vivo = true;
    api
      .feed(tipo ? { tipo } : undefined)
      .then((r) => vivo && setTarjetas(r.tarjetas))
      .catch(() => vivo && setTarjetas([]));
    return () => {
      vivo = false;
    };
  }, [tipo]);

  if (tarjetas === null) return <p className="text-tinta-suave">Cargando muro…</p>;

  return (
    <div className="flex flex-col gap-4">
      {accionHref && accionTexto && puedeInteractuar && (
        <div>
          <Link href={accionHref}>
            <Boton>{accionTexto}</Boton>
          </Link>
        </div>
      )}
      <FeedInfinito tarjetasIniciales={tarjetas} tipo={tipo} />
    </div>
  );
}

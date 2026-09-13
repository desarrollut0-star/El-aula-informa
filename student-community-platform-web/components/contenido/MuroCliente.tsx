"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TarjetaContenido as Tarjeta, TipoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { FeedInfinito } from "./FeedInfinito";
import { clasesBoton } from "@/components/ui/Boton";
import { EsqueletoLista } from "@/components/ui/Esqueleto";

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

  return (
    <div className="flex flex-col gap-4">
      {accionHref && accionTexto && puedeInteractuar && (
        <div>
          <Link href={accionHref} className={clasesBoton("primario")}>
            {accionTexto}
          </Link>
        </div>
      )}
      {tarjetas === null ? <EsqueletoLista /> : <FeedInfinito tarjetasIniciales={tarjetas} tipo={tipo} />}
    </div>
  );
}

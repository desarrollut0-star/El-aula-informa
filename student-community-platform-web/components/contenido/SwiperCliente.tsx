"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TarjetaContenido as Tarjeta } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { SwiperDeck } from "./SwiperDeck";

/** Carga los testimonios del swiper con el token de sesión. */
export function SwiperCliente() {
  const { puedeInteractuar } = useSesion();
  const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null);

  useEffect(() => {
    let vivo = true;
    api
      .swiper()
      .then((r) => vivo && setTarjetas(r.tarjetas))
      .catch(() => vivo && setTarjetas([]));
    return () => {
      vivo = false;
    };
  }, []);

  if (!puedeInteractuar) {
    return (
      <p className="max-w-sm text-center text-sm text-tinta-suave">
        Para calificar testimonios necesitas una cuenta verificada con los términos
        aceptados. Revísalo en{" "}
        <Link href="/yo" className="underline">Mi cuenta</Link>.
      </p>
    );
  }

  if (tarjetas === null) return <p className="text-tinta-suave">Cargando…</p>;

  return <SwiperDeck tarjetasIniciales={tarjetas} />;
}

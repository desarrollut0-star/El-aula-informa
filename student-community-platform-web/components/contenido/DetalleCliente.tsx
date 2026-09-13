"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TarjetaContenido as Tarjeta } from "@/lib/tipos";
import { api, ApiError } from "@/lib/api-client";
import { EsqueletoComentarios, EsqueletoTarjeta } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Iconos";
import { TarjetaContenido } from "./TarjetaContenido";
import { ComentariosHilo } from "./ComentariosHilo";

function Volver() {
  return (
    <Link
      href="/muro"
      className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-tinta-suave transition-colors hover:text-verde-oscuro"
    >
      <Icono nombre="flechaIzq" className="h-4 w-4 transition-transform duration-200 ease-suave group-hover:-translate-x-0.5" />
      Volver al muro
    </Link>
  );
}

export function DetalleCliente({ id }: { id: string }) {
  const router = useRouter();
  const [tarjeta, setTarjeta] = useState<Tarjeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    api
      .contenido(id)
      .then((r) => vivo && setTarjeta(r.tarjeta))
      .catch((e) => vivo && setError(e instanceof ApiError ? e.message : "No se pudo cargar."));
    return () => {
      vivo = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Volver />
        <div className="tarjeta animate-aparecer p-6 text-center">
          <p className="text-sm text-terracota">{error}</p>
        </div>
      </div>
    );
  }

  if (!tarjeta) {
    return (
      <div className="flex flex-col gap-6" role="status">
        <Volver />
        <EsqueletoTarjeta />
        <div className="tarjeta p-5 md:p-6">
          <EsqueletoComentarios />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Volver />
      <div className="animate-aparecer">
        <TarjetaContenido tarjeta={tarjeta} onEliminada={() => router.push("/muro")} />
      </div>
      <div className="animate-aparecer [animation-delay:80ms]">
        <ComentariosHilo contenidoId={id} />
      </div>
    </div>
  );
}

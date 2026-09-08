"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TarjetaContenido as Tarjeta } from "@/lib/tipos";
import { api, ApiError } from "@/lib/api-client";
import { TarjetaContenido } from "./TarjetaContenido";
import { ComentariosHilo } from "./ComentariosHilo";

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
      <div>
        <p className="text-sm text-terracota">{error}</p>
        <Link href="/muro" className="mt-3 inline-block text-sm underline">Volver al muro</Link>
      </div>
    );
  }

  if (!tarjeta) return <p className="text-tinta-suave">Cargando…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/muro" className="text-sm text-tinta-suave underline">← Muro</Link>
      <TarjetaContenido tarjeta={tarjeta} onEliminada={() => router.push("/muro")} />
      <ComentariosHilo contenidoId={id} />
    </div>
  );
}

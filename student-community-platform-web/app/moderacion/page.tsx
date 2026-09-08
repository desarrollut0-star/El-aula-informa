"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";

/**
 * Panel del equipo. Leerá de `vista_cola_moderacion` (tarjetas en revisión
 * u ocultas, o con 5+ reportes). Endpoint pendiente; por ahora solo se
 * restringe el acceso a la cuenta oficial.
 */
export default function PanelModeracion() {
  const { estado, sesion } = useSesion();

  if (estado === "cargando") return <p className="text-tinta-suave">Cargando…</p>;

  if (estado !== "dentro" || !sesion?.esCuentaOficial) {
    return (
      <div className="mx-auto max-w-md border border-borde bg-papel-alt p-6 text-center">
        <h1 className="text-2xl">Moderación</h1>
        <p className="mt-2 text-sm text-tinta-suave">
          Esta sección es solo para la cuenta de la Sociedad Estudiantil.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl">Moderación</h1>
      <p className="max-w-prose text-tinta-suave">
        Cola de revisión: publicaciones en revisión, ocultas o con muchos reportes, con su
        última acción y las apelaciones pendientes.
      </p>
      <p className="max-w-prose text-sm italic text-tinta-suave">
        El panel operativo (aprobar / ocultar / responder apelaciones) se conecta en la
        siguiente iteración. Por ahora, el auto-ocultado por reportes ya funciona solo.
      </p>
    </div>
  );
}

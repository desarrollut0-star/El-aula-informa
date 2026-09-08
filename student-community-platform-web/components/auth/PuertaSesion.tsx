"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";

/**
 * Envuelve el contenido que solo pueden ver quienes iniciaron sesión.
 * Los visitantes ven una invitación a acceder, no el muro.
 */
export function PuertaSesion({
  children,
  titulo = "Contenido para la comunidad",
}: {
  children: React.ReactNode;
  titulo?: string;
}) {
  const { estado } = useSesion();

  if (estado === "cargando") {
    return <p className="text-tinta-suave">Cargando…</p>;
  }

  if (estado === "invitado") {
    return (
      <div className="mx-auto max-w-md border border-borde bg-papel-alt p-6 text-center">
        <h1 className="text-2xl">{titulo}</h1>
        <p className="mt-2 text-sm text-tinta-suave">
          El muro, los avisos y los reportes son para la comunidad de la UTHH.
          Inicia sesión con tu correo institucional para verlos.
        </p>
        <Link
          href="/acceso"
          className="mt-4 inline-block rounded bg-verde px-4 py-2 text-sm font-semibold text-blanco-papel hover:bg-verde-oscuro"
        >
          Acceder
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

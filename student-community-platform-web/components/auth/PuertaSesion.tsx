"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";
import { clasesBoton } from "@/components/ui/Boton";
import { EsqueletoLista } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Iconos";

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
    return <EsqueletoLista cantidad={2} />;
  }

  if (estado === "invitado") {
    return (
      <div className="tarjeta mx-auto max-w-md animate-aparecer p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-verde-tenue text-verde-oscuro">
          <Icono nombre="candado" className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-2xl">{titulo}</h1>
        <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
          El muro, los avisos y los reportes son para la comunidad de la UTHH. Inicia sesión con tu correo
          institucional para verlos.
        </p>
        <Link href="/acceso" className={clasesBoton("primario", "mt-6")}>
          Acceder
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

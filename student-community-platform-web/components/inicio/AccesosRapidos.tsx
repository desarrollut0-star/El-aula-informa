"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";

interface Acceso {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: string;
}

const ACCESOS: Acceso[] = [
  { href: "/muro/nuevo", etiqueta: "Compartir testimonio", descripcion: "Cuenta cómo te afecta el paro", icono: "📝" },
  { href: "/eventos/nueva", etiqueta: "Publicar un evento", descripcion: "Asamblea, marcha o actividad", icono: "📅" },
  { href: "/denuncias/nueva", etiqueta: "Reportar irregularidad", descripcion: "Con evidencia si tienes", icono: "📮" },
  { href: "/propuestas/nueva", etiqueta: "Proponer algo", descripcion: "Una acción para la comunidad", icono: "💡" },
];

/**
 * Acciones de creación a un toque. Solo se muestran a cuentas que pueden
 * interactuar; una cuenta en solo lectura no las ve.
 */
export function AccesosRapidos() {
  const { puedeInteractuar } = useSesion();
  if (!puedeInteractuar) return null;

  return (
    <div className="grid grid-cols-2 gap-px border border-borde bg-borde md:grid-cols-4">
      {ACCESOS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex flex-col gap-1 bg-blanco-papel p-4 text-tinta transition-colors hover:bg-verde-tenue"
        >
          <span className="text-2xl">{a.icono}</span>
          <span className="text-sm font-semibold">{a.etiqueta}</span>
          <span className="text-xs text-tinta-suave">{a.descripcion}</span>
        </Link>
      ))}
    </div>
  );
}

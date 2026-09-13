"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

interface Acceso {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: NombreIcono;
}

const ACCESOS: Acceso[] = [
  { href: "/muro/nuevo", etiqueta: "Compartir testimonio", descripcion: "Cuenta cómo te afecta el paro", icono: "pluma" },
  { href: "/eventos/nueva", etiqueta: "Publicar un evento", descripcion: "Asamblea, marcha o actividad", icono: "calendario" },
  { href: "/denuncias/nueva", etiqueta: "Reportar irregularidad", descripcion: "Con evidencia si tienes", icono: "escudo" },
  { href: "/propuestas/nueva", etiqueta: "Proponer algo", descripcion: "Una acción para la comunidad", icono: "foco" },
];

/**
 * Acciones de creación a un toque. Solo se muestran a cuentas que pueden
 * interactuar; una cuenta en solo lectura no las ve.
 */
export function AccesosRapidos() {
  const { puedeInteractuar } = useSesion();
  if (!puedeInteractuar) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ACCESOS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="tarjeta group flex flex-col gap-3 p-4 transition-[box-shadow,border-color,transform] duration-300 ease-suave hover:-translate-y-0.5 hover:border-verde-linea hover:shadow-elevada active:translate-y-0"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-verde-tenue text-verde-oscuro transition-colors duration-300 group-hover:bg-verde group-hover:text-blanco-papel">
            <Icono nombre={a.icono} className="h-5 w-5" />
          </span>
          <span>
            <span className="flex items-center gap-1 text-sm font-semibold text-tinta">
              {a.etiqueta}
              <Icono
                nombre="flechaDer"
                className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-verde opacity-0 transition-[opacity,transform] duration-300 ease-suave group-hover:translate-x-0 group-hover:opacity-100"
              />
            </span>
            <span className="mt-0.5 block text-xs text-tinta-suave">{a.descripcion}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

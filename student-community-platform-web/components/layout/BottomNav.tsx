"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";

const DENTRO = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/swiper", etiqueta: "Swiper" },
  { href: "/muro", etiqueta: "Muro" },
  { href: "/avisos", etiqueta: "Avisos" },
  { href: "/yo", etiqueta: "Mi cuenta" },
];

const INVITADO = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/nosotros", etiqueta: "La comunidad" },
  { href: "/acceso", etiqueta: "Acceder" },
];

/** Solo en celular: la app se opera de una mano. */
export function BottomNav() {
  const { estado } = useSesion();
  const items = estado === "dentro" ? DENTRO : INVITADO;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-borde bg-blanco-papel py-2 text-xs font-semibold text-tinta-suave md:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex-1 px-2 py-1 text-center hover:text-verde">
          {item.etiqueta}
        </Link>
      ))}
    </nav>
  );
}

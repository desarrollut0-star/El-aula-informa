"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSesion } from "@/lib/sesion";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

interface Item {
  href: string;
  etiqueta: string;
  icono: NombreIcono;
}

const DENTRO: Item[] = [
  { href: "/", etiqueta: "Inicio", icono: "casa" },
  { href: "/swiper", etiqueta: "Swiper", icono: "capas" },
  { href: "/muro", etiqueta: "Muro", icono: "lista" },
  { href: "/avisos", etiqueta: "Avisos", icono: "megafono" },
  { href: "/yo", etiqueta: "Cuenta", icono: "usuario" },
];

const INVITADO: Item[] = [
  { href: "/", etiqueta: "Inicio", icono: "casa" },
  { href: "/nosotros", etiqueta: "Comunidad", icono: "usuarios" },
  { href: "/acceso", etiqueta: "Acceder", icono: "entrar" },
];

/** Solo en celular: la app se opera de una mano. */
export function BottomNav() {
  const { estado } = useSesion();
  const pathname = usePathname() ?? "/";
  const items = estado === "dentro" ? DENTRO : INVITADO;

  return (
    <nav
      aria-label="Navegación inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde/80 bg-blanco-papel/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(18,53,34,0.45)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around px-2 py-1.5">
        {items.map((item) => {
          const activa = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={activa ? "page" : undefined}
                className={`group flex flex-col items-center gap-0.5 rounded-xl py-0.5 text-[11px] font-semibold transition-colors duration-200 ${
                  activa ? "text-verde-oscuro" : "text-tinta-suave hover:text-verde"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,transform] duration-300 ease-suave group-active:scale-90 ${
                    activa ? "bg-verde-tenue" : ""
                  }`}
                >
                  <Icono nombre={item.icono} className="h-[18px] w-[18px]" grosor={activa ? 2.1 : 1.8} />
                </span>
                {item.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

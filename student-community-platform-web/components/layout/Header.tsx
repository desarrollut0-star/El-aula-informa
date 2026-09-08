"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSesion } from "@/lib/sesion";

const NAV_DENTRO = [
  { href: "/muro", txt: "Muro" },
  { href: "/avisos", txt: "Avisos" },
  { href: "/eventos", txt: "Eventos" },
  { href: "/propuestas", txt: "Propuestas" },
  { href: "/encuestas", txt: "Encuestas" },
  { href: "/denuncias", txt: "Reportes" },
  { href: "/buscar", txt: "Buscar" },
];

export function Header() {
  const { estado, sesion, cerrarSesion } = useSesion();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  async function salir() {
    setMenu(false);
    await cerrarSesion();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b-4 border-ocre bg-verde-oscuro text-blanco-papel">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-3">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-display text-xl font-extrabold tracking-wide">El Aula Informa</span>
          <span className="text-xs text-verde-linea">Huejutla de Reyes, Hidalgo</span>
        </Link>

        {estado === "dentro" ? (
          <nav className="-mx-4 flex items-center gap-x-4 overflow-x-auto whitespace-nowrap px-4 text-sm font-semibold md:mx-0 md:flex-wrap md:gap-y-1 md:overflow-visible md:whitespace-normal md:px-0">
            {NAV_DENTRO.map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 hover:text-verde-linea">
                {n.txt}
              </Link>
            ))}

            <div ref={ref} className="relative shrink-0">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-1 rounded border border-verde-linea/40 px-2 py-1 hover:bg-verde/40"
              >
                <span className="max-w-[10rem] truncate">{sesion?.alias ?? "Mi cuenta"}</span>
                <span aria-hidden>▾</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-1 w-48 rounded border border-borde bg-blanco-papel py-1 text-tinta shadow-lg">
                  <Link
                    href="/yo"
                    onClick={() => setMenu(false)}
                    className="block px-3 py-2 text-sm hover:bg-papel-alt"
                  >
                    Mi cuenta
                  </Link>
                  <Link
                    href="/notificaciones"
                    onClick={() => setMenu(false)}
                    className="block px-3 py-2 text-sm hover:bg-papel-alt"
                  >
                    Notificaciones
                  </Link>
                  {sesion && sesion.rol !== "verificado" && (
                    <p className="px-3 py-2 text-xs text-terracota">Cuenta en modo solo lectura</p>
                  )}
                  <button
                    onClick={salir}
                    className="block w-full px-3 py-2 text-left text-sm text-terracota hover:bg-papel-alt"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/nosotros" className="hover:text-verde-linea">La comunidad</Link>
            <Link
              href="/acceso"
              className="rounded bg-blanco-papel px-3 py-1 text-verde-oscuro hover:opacity-90"
            >
              Acceder
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

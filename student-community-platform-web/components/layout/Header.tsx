"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSesion } from "@/lib/sesion";
import { AvatarAlias } from "@/components/contenido/AvatarAlias";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

const NAV_DENTRO = [
  { href: "/muro", txt: "Muro" },
  { href: "/avisos", txt: "Avisos" },
  { href: "/eventos", txt: "Eventos" },
  { href: "/propuestas", txt: "Propuestas" },
  { href: "/encuestas", txt: "Encuestas" },
  { href: "/denuncias", txt: "Reportes" },
  { href: "/buscar", txt: "Buscar" },
];

function esActiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Header() {
  const { estado, sesion, cerrarSesion } = useSesion();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  async function salir() {
    setMenu(false);
    await cerrarSesion();
    router.push("/");
  }

  const alias = sesion?.alias ?? "Mi cuenta";

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ocre bg-verde-oscuro text-blanco-papel shadow-[0_8px_24px_-16px_rgba(18,53,34,0.7)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center px-4 md:h-16 md:flex-nowrap md:gap-6">
        <Link href="/" className="group order-1 mr-auto flex h-14 items-center gap-2.5 md:h-auto">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocre font-display text-lg font-extrabold leading-none text-blanco-papel shadow-sm transition-transform duration-300 ease-suave group-hover:-rotate-6">
            A
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-extrabold tracking-wide">El Aula Informa</span>
            <span className="mt-0.5 text-[11px] text-verde-linea">Huejutla de Reyes, Hidalgo</span>
          </span>
        </Link>

        {estado === "cargando" && <div className="order-2 h-8 w-28 rounded-full bg-verde/40" aria-hidden />}

        {estado === "dentro" && (
          <>
            <nav
              aria-label="Principal"
              className="order-3 -mx-4 flex h-10 w-[calc(100%+2rem)] items-center gap-5 overflow-x-auto whitespace-nowrap px-4 text-sm font-semibold [scrollbar-width:none] md:order-2 md:mx-0 md:h-auto md:w-auto md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {NAV_DENTRO.map((n) => {
                const activa = esActiva(pathname, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={activa ? "page" : undefined}
                    className={`relative shrink-0 py-1.5 transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-ocre after:transition-transform after:duration-300 after:ease-suave ${
                      activa
                        ? "text-blanco-papel after:scale-x-100"
                        : "text-blanco-papel/70 after:scale-x-0 hover:text-blanco-papel hover:after:scale-x-100"
                    }`}
                  >
                    {n.txt}
                  </Link>
                );
              })}
            </nav>

            <div ref={ref} className="relative order-2 md:order-3 md:ml-auto">
              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-sm font-semibold transition-colors duration-200 ${
                  menu ? "border-verde-linea/60 bg-verde/60" : "border-verde-linea/30 hover:bg-verde/40"
                }`}
              >
                <AvatarAlias alias={sesion?.alias ?? null} anonimo={false} oficial={sesion?.esCuentaOficial} size={26} />
                <span className="hidden max-w-[9rem] truncate sm:inline">{alias}</span>
                <Icono
                  nombre="chevron"
                  grosor={2.2}
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-suave ${menu ? "rotate-180" : ""}`}
                />
              </button>

              {menu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-menu overflow-hidden rounded-xl border border-borde/80 bg-blanco-papel p-1.5 text-tinta shadow-flotante"
                >
                  <div className="px-2.5 pb-2 pt-1.5">
                    <p className="truncate text-sm font-semibold text-verde-oscuro">{alias}</p>
                    <p className="text-xs text-tinta-suave">
                      {sesion?.rol === "verificado" ? "Cuenta verificada" : "Cuenta en modo solo lectura"}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-borde/70" />
                  <ItemMenu href="/yo" icono="usuario" onElegir={() => setMenu(false)}>
                    Mi cuenta
                  </ItemMenu>
                  <ItemMenu href="/mis-publicaciones" icono="lista" onElegir={() => setMenu(false)}>
                    Mis publicaciones
                  </ItemMenu>
                  <ItemMenu href="/notificaciones" icono="campana" onElegir={() => setMenu(false)}>
                    Notificaciones
                  </ItemMenu>
                  <div className="my-1 h-px bg-borde/70" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={salir}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-terracota transition-colors hover:bg-terracota-tenue"
                  >
                    <Icono nombre="salir" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {estado === "invitado" && (
          <nav className="order-2 flex items-center gap-4 text-sm font-semibold">
            <Link
              href="/nosotros"
              className="hidden text-blanco-papel/75 transition-colors hover:text-blanco-papel sm:inline"
            >
              La comunidad
            </Link>
            <Link
              href="/acceso"
              className="rounded-lg bg-blanco-papel px-3.5 py-1.5 text-verde-oscuro shadow-sm transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.98]"
            >
              Acceder
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

function ItemMenu({
  href,
  icono,
  onElegir,
  children,
}: {
  href: string;
  icono: NombreIcono;
  onElegir: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onElegir}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-papel-alt"
    >
      <Icono nombre={icono} className="h-4 w-4 text-tinta-suave" />
      {children}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSesion } from "@/lib/sesion";
import { AvatarAlias } from "@/components/contenido/AvatarAlias";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";
import { CampanaNotificaciones } from "./CampanaNotificaciones";

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
  const verificada = sesion?.rol === "verificado";

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

            <div className="order-2 flex items-center gap-1.5 md:order-3 md:ml-auto">
              <CampanaNotificaciones />

              <div ref={ref} className="relative">
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
                    className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-menu overflow-hidden rounded-2xl border border-borde/80 bg-blanco-papel text-tinta shadow-flotante"
                  >
                    <div className="flex items-center gap-3 bg-papel-alt/50 px-4 py-3.5">
                      <AvatarAlias alias={sesion?.alias ?? null} anonimo={false} oficial={sesion?.esCuentaOficial} size={40} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-verde-oscuro">{alias}</p>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            verificada ? "bg-verde-tenue text-verde-oscuro" : "bg-ocre-tenue text-ocre"
                          }`}
                        >
                          <Icono nombre={verificada ? "check" : "candado"} className="h-3 w-3" grosor={2.4} />
                          {verificada ? "Verificada" : "Solo lectura"}
                        </span>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <ItemMenu href="/yo" icono="usuario" descripcion="Perfil y privacidad" onElegir={() => setMenu(false)}>
                        Mi cuenta
                      </ItemMenu>
                      <ItemMenu
                        href="/mis-publicaciones"
                        icono="lista"
                        descripcion="Lo que has compartido"
                        onElegir={() => setMenu(false)}
                      >
                        Mis publicaciones
                      </ItemMenu>
                    </div>

                    <div className="border-t border-borde/70 p-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={salir}
                        className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-terracota transition-colors hover:bg-terracota-tenue"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracota-tenue/70 transition-colors group-hover:bg-blanco-papel/60">
                          <Icono nombre="salir" />
                        </span>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
  descripcion,
  onElegir,
  children,
}: {
  href: string;
  icono: NombreIcono;
  descripcion: string;
  onElegir: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onElegir}
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-papel-alt"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-papel-alt text-tinta-suave transition-colors group-hover:bg-verde-tenue group-hover:text-verde-oscuro">
        <Icono nombre={icono} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-tinta">{children}</span>
        <span className="block text-xs text-tinta-suave">{descripcion}</span>
      </span>
    </Link>
  );
}

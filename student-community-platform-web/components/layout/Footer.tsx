import Link from "next/link";

const GRUPOS: { titulo: string; enlaces: { href: string; etiqueta: string }[] }[] = [
  {
    titulo: "Participar",
    enlaces: [
      { href: "/encuestas", etiqueta: "Encuestas" },
      { href: "/asambleas", etiqueta: "Asambleas" },
      { href: "/respaldo", etiqueta: "Firmar respaldo" },
      { href: "/buscar", etiqueta: "Buscar" },
    ],
  },
  {
    titulo: "Mi cuenta",
    enlaces: [
      { href: "/yo", etiqueta: "Mi cuenta" },
      { href: "/mis-publicaciones", etiqueta: "Mis publicaciones" },
      { href: "/notificaciones", etiqueta: "Notificaciones" },
    ],
  },
  {
    titulo: "Comunidad",
    enlaces: [
      { href: "/nosotros", etiqueta: "Nosotros" },
      { href: "/codigo-de-conducta", etiqueta: "Código de conducta" },
      { href: "/preguntas-frecuentes", etiqueta: "Preguntas frecuentes" },
      { href: "/moderacion", etiqueta: "Moderación" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { href: "/privacidad", etiqueta: "Aviso de privacidad" },
      { href: "/terminos", etiqueta: "Términos de uso" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mb-16 border-t border-borde/80 bg-papel-alt/60 md:mb-0">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-verde-oscuro font-display text-base font-extrabold leading-none text-blanco-papel">
                A
              </span>
              <span className="font-display text-lg font-extrabold text-verde-oscuro">El Aula Informa</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-tinta-suave">
              Participación de la comunidad estudiantil de la UTHH.
            </p>
          </div>

          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-tinta-suave">{g.titulo}</p>
              <ul className="flex flex-col gap-2 text-sm">
                {g.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link href={e.href} className="text-tinta-suave transition-colors hover:text-verde-oscuro">
                      {e.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 border-t border-borde/70 pt-6 text-xs text-tinta-suave">
          El Aula Informa es un proyecto estudiantil independiente. No representa oficialmente a la UTHH ni al
          SUTUTEH.
        </p>
      </div>
    </footer>
  );
}

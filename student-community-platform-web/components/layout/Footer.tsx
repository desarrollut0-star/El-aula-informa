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
    <footer className="mb-16 border-t border-borde bg-papel-alt py-8 md:mb-0">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {GRUPOS.map((g) => (
          <div key={g.titulo}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-tinta-suave">{g.titulo}</p>
            <ul className="flex flex-col gap-1 text-sm text-tinta-suave">
              {g.enlaces.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="hover:text-verde">{e.etiqueta}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-5xl px-4 text-xs text-tinta-suave">
        El Aula Informa es un proyecto estudiantil independiente. No representa oficialmente a la
        UTHH ni al SUTUTEH.
      </p>
    </footer>
  );
}

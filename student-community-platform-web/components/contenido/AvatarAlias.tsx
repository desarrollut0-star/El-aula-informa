import { Icono } from "@/components/ui/Iconos";

/**
 * Avatar sin foto: inicial del alias sobre un color estable derivado del
 * propio alias. Para anónimo, un ícono neutro. Nunca usa datos reales:
 * el alias ya es un seudónimo.
 */
const COLORES = ["#1F5D3E", "#2E3F66", "#8A5A00", "#7A3E3E", "#3B6FA6", "#5B4B8A", "#2F7D5E"];

function colorDe(txt: string): string {
  let h = 0;
  for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) >>> 0;
  return COLORES[h % COLORES.length]!;
}

export function AvatarAlias({
  alias,
  anonimo,
  oficial,
  size = 38,
}: {
  alias: string | null;
  anonimo: boolean;
  oficial?: boolean;
  size?: number;
}) {
  const estilo = { width: size, height: size, fontSize: size * 0.42 };
  const icono = { width: size * 0.5, height: size * 0.5 };

  if (anonimo || !alias) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-papel-alt text-tinta-suave ring-1 ring-inset ring-borde/70"
        style={estilo}
        aria-hidden
      >
        <span style={icono} className="flex">
          <Icono nombre="usuario" className="h-full w-full" />
        </span>
      </span>
    );
  }

  if (oficial) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-verde-oscuro text-ocre-tenue ring-1 ring-inset ring-ocre/40"
        style={estilo}
        aria-hidden
      >
        <span style={icono} className="flex">
          <Icono nombre="estrella" className="h-full w-full" grosor={2} />
        </span>
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ring-1 ring-inset ring-black/5"
      style={{ ...estilo, background: colorDe(alias) }}
      aria-hidden
    >
      {alias.replace(/^alumno_/, "").charAt(0).toUpperCase()}
    </span>
  );
}

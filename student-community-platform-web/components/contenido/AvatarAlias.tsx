/**
 * Avatar sin foto: inicial del alias sobre un color estable derivado del
 * propio alias. Para anónimo, un ícono neutro. Nunca usa datos reales:
 * el alias ya es un seudónimo.
 */
const COLORES = [
  "#1F5D3E", "#2E3F66", "#8A5A00", "#7A3E3E", "#3B6FA6", "#5B4B8A", "#2F7D5E",
];

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

  if (anonimo || !alias) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-papel-alt text-tinta-suave"
        style={estilo}
        aria-hidden
      >
        🎭
      </span>
    );
  }

  if (oficial) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-verde-oscuro text-blanco-papel"
        style={estilo}
        aria-hidden
      >
        ★
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ ...estilo, background: colorDe(alias) }}
      aria-hidden
    >
      {alias.replace(/^alumno_/, "").charAt(0).toUpperCase()}
    </span>
  );
}

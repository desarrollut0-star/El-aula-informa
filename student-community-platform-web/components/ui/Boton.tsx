import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro";

const CLASES: Record<Variante, string> = {
  primario: "bg-verde text-blanco-papel hover:bg-verde-oscuro",
  secundario: "border border-borde bg-blanco-papel text-tinta hover:bg-papel-alt",
  peligro: "bg-terracota text-blanco-papel hover:opacity-90",
};

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      className={`rounded px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${CLASES[variante]} ${className}`}
      {...props}
    />
  );
}

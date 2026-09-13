import type { ButtonHTMLAttributes } from "react";

export type VarianteBoton = "primario" | "secundario" | "peligro" | "fantasma" | "claro" | "contornoClaro";
export type TamanoBoton = "normal" | "chico";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-suave " +
  "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde focus-visible:ring-offset-2 focus-visible:ring-offset-papel";

const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-verde text-blanco-papel shadow-sm hover:bg-verde-oscuro hover:shadow-elevada",
  secundario: "border border-borde bg-blanco-papel text-tinta hover:border-verde-linea hover:bg-papel-alt",
  peligro: "bg-terracota text-blanco-papel shadow-sm hover:bg-terracota/90",
  fantasma: "text-tinta-suave hover:bg-papel-alt hover:text-tinta",
  claro: "bg-blanco-papel text-verde-oscuro shadow-sm hover:bg-white hover:shadow-elevada",
  contornoClaro: "border border-blanco-papel/35 text-blanco-papel hover:border-blanco-papel/60 hover:bg-blanco-papel/10",
};

const TAMANOS: Record<TamanoBoton, string> = {
  normal: "px-4 py-2 text-sm",
  chico: "px-3 py-1.5 text-xs",
};

/** Clases de botón para usarlas también en <Link> sin anidar un <button>. */
export function clasesBoton(variante: VarianteBoton = "primario", extra = "", tamano: TamanoBoton = "normal") {
  return `${BASE} ${TAMANOS[tamano]} ${VARIANTES[variante]} ${extra}`;
}

export function Boton({
  variante = "primario",
  tamano = "normal",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBoton; tamano?: TamanoBoton }) {
  return <button className={clasesBoton(variante, className, tamano)} {...props} />;
}

"use client";

import { useEffect, useState } from "react";

/**
 * Despliega y oculta contenido con una transición de altura fluida, sin
 * medir el DOM ni usar librerías: anima `grid-template-rows` de 0fr a 1fr.
 *
 * Mientras está cerrado el contenido es `inert` (no se puede enfocar con
 * teclado). Al terminar de abrir se quita el `overflow-hidden` para que los
 * anillos de foco y los menús internos no se recorten.
 */
export function Colapsable({
  abierto,
  children,
  id,
  className = "",
}: {
  abierto: boolean;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const [asentado, setAsentado] = useState(abierto);

  useEffect(() => {
    if (!abierto) setAsentado(false);
  }, [abierto]);

  // Next 15 corre con el React que trae integrado, que trata `inert` como
  // booleano: con "" lo ignora. Los tipos de @types/react 18 aún no lo
  // declaran, de ahí el cast.
  const inerte = abierto ? {} : ({ inert: true } as Record<string, boolean>);

  return (
    <div
      id={id}
      aria-hidden={!abierto}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && abierto) setAsentado(true);
      }}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-suave ${
        abierto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      } ${className}`}
      {...inerte}
    >
      <div className={`min-h-0 ${abierto && asentado ? "" : "overflow-hidden"}`}>{children}</div>
    </div>
  );
}

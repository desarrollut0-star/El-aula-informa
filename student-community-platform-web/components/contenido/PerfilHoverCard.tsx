"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarAlias } from "./AvatarAlias";

/**
 * Vista previa del autor al pasar el cursor (o tocar) el avatar — estilo
 * Discord. NUNCA muestra datos reales: el alias ya es un seudónimo y, si la
 * publicación es anónima, no hay nada que enseñar.
 */
export function PerfilHoverCard({
  alias,
  programa,
  anonimo,
  oficial,
  size = 38,
}: {
  alias: string | null;
  programa: string | null;
  anonimo: boolean;
  oficial: boolean;
  size?: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="block rounded-full ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
        aria-label="Ver autor"
      >
        <AvatarAlias alias={alias} anonimo={anonimo} oficial={oficial} size={size} />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full z-30 mt-2 w-60 rounded-lg border border-borde bg-blanco-papel p-4 text-left shadow-xl">
          <div className="flex items-center gap-3">
            <AvatarAlias alias={alias} anonimo={anonimo} oficial={oficial} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-verde-oscuro">
                {anonimo ? "Publicación anónima" : oficial ? "Sociedad Estudiantil" : alias}
              </p>
              <p className="text-xs text-tinta-suave">
                {anonimo ? "Autor oculto" : oficial ? "Cuenta oficial" : "Miembro de la comunidad"}
              </p>
            </div>
          </div>

          <dl className="mt-3 space-y-1.5 text-xs">
            {anonimo ? (
              <p className="text-tinta-suave">
                El autor eligió no mostrar su alias ni su programa. Nadie —ni el equipo
                desde el muro— puede verlo aquí.
              </p>
            ) : (
              <>
                <div className="flex justify-between gap-2">
                  <dt className="text-tinta-suave">Alias</dt>
                  <dd className="truncate">{oficial ? "Sociedad Estudiantil" : alias}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-tinta-suave">Programa</dt>
                  <dd className="truncate text-right">{oficial ? "—" : (programa ?? "Sin registrar")}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-tinta-suave">Tipo</dt>
                  <dd>{oficial ? "Cuenta oficial" : "Alumno verificado"}</dd>
                </div>
              </>
            )}
          </dl>

          <p className="mt-3 border-t border-borde pt-2 text-[11px] text-tinta-suave">
            El nombre real y el correo nunca se muestran a nadie.
          </p>
        </div>
      )}
    </div>
  );
}

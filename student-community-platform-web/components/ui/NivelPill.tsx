import type { Nivel } from "@/lib/tipos";

const ETIQUETA: Record<Nivel, string> = { bajo: "Bajo", medio: "Medio", alto: "Alto" };
const COLOR: Record<Nivel, string> = {
  bajo: "text-nivel-bajo border-nivel-bajo bg-nivel-bajo/10",
  medio: "text-nivel-medio border-nivel-medio bg-nivel-medio/10",
  alto: "text-nivel-alto border-nivel-alto bg-nivel-alto/10",
};

/** El nivel usa un color semántico propio, distinto del verde de marca. */
export function NivelPill({ nivel }: { nivel: Nivel }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${COLOR[nivel]}`}>
      {ETIQUETA[nivel]}
    </span>
  );
}

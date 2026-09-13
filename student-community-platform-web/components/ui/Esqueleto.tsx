/**
 * Siluetas de carga. Ocupan el mismo espacio que el contenido real, así la
 * página no "brinca" cuando llegan los datos.
 */
export function EsqueletoTarjeta() {
  return (
    <div className="tarjeta p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="esqueleto h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="esqueleto h-3 w-32 rounded" />
          <div className="esqueleto h-2.5 w-20 rounded" />
        </div>
        <div className="esqueleto h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="esqueleto h-3 w-full rounded" />
        <div className="esqueleto h-3 w-11/12 rounded" />
        <div className="esqueleto h-3 w-2/3 rounded" />
      </div>
      <div className="mt-4 flex gap-2 border-t border-borde/60 pt-3">
        <div className="esqueleto h-7 w-14 rounded-full" />
        <div className="esqueleto h-7 w-14 rounded-full" />
        <div className="esqueleto h-7 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function EsqueletoLista({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: cantidad }, (_, i) => (
        <EsqueletoTarjeta key={i} />
      ))}
    </div>
  );
}

export function EsqueletoComentarios() {
  return (
    <div className="flex flex-col gap-5" role="status">
      <span className="sr-only">Cargando comentarios…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3" aria-hidden>
          <div className="esqueleto h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="esqueleto h-2.5 w-40 rounded" />
            <div className="esqueleto h-3 w-full rounded" />
            <div className="esqueleto h-3 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

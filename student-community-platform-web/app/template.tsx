/**
 * Se vuelve a montar en cada cambio de ruta: da una entrada suave a cada
 * página. Solo anima opacidad y un desplazamiento mínimo (barato en GPU).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-pagina">{children}</div>;
}

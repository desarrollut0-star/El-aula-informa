import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

/**
 * Mini-foro temático (sección 15.4). El filtro por etiqueta real se
 * resuelve en el backend; aquí se pide el feed completo como placeholder
 * mientras se agrega el parámetro `etiqueta` a /contenido/feed.
 */
export default async function PaginaEtiqueta({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return (
    <PuertaSesion titulo={`#${decodeURIComponent(tag)}`}>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">#{decodeURIComponent(tag)}</h1>
        <MuroCliente />
      </div>
    </PuertaSesion>
  );
}

import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { DetalleCliente } from "@/components/contenido/DetalleCliente";

export const metadata = { title: "Publicación — El Aula Informa" };

export default async function DetalleContenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PuertaSesion titulo="Publicación de la comunidad">
      <DetalleCliente id={id} />
    </PuertaSesion>
  );
}

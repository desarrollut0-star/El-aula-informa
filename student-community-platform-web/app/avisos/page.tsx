import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Avisos — El Aula Informa" };

export default function Avisos() {
  return (
    <PuertaSesion titulo="Avisos de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Avisos</h1>
          <p className="text-tinta-suave">Comunicados oficiales de la Sociedad Estudiantil.</p>
        </div>
        <MuroCliente tipo="aviso" />
      </div>
    </PuertaSesion>
  );
}

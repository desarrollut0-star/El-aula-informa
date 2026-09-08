import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Eventos — El Aula Informa" };

export default function Eventos() {
  return (
    <PuertaSesion titulo="Eventos de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Eventos</h1>
          <p className="text-tinta-suave">Asambleas, marchas y actividades de la comunidad.</p>
        </div>
        <MuroCliente tipo="evento" accionHref="/eventos/nueva" accionTexto="Publicar un evento" />
      </div>
    </PuertaSesion>
  );
}

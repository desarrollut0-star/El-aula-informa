import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Asambleas — El Aula Informa" };

/**
 * Por ahora las asambleas se convocan como eventos en el muro. El módulo
 * propio (orden del día, minutas, acuerdos) llega después.
 */
export default function Asambleas() {
  return (
    <PuertaSesion titulo="Asambleas de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Asambleas</h1>
          <p className="text-tinta-suave">
            Convocatorias a asamblea. El orden del día y las minutas se publican en cada evento.
          </p>
        </div>
        <MuroCliente tipo="evento" accionHref="/eventos/nueva" accionTexto="Convocar una asamblea" />
      </div>
    </PuertaSesion>
  );
}

import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Propuestas — El Aula Informa" };

export default function Propuestas() {
  return (
    <PuertaSesion titulo="Propuestas de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Propuestas</h1>
          <p className="text-tinta-suave">
            Ideas de acción de la comunidad. Cualquier alumno verificado puede proponer.
          </p>
        </div>
        <MuroCliente tipo="propuesta" accionHref="/propuestas/nueva" accionTexto="Hacer una propuesta" />
      </div>
    </PuertaSesion>
  );
}

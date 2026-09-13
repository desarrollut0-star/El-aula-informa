import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Encuestas — El Aula Informa" };

export default function Encuestas() {
  return (
    <PuertaSesion titulo="Encuestas de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Encuestas</h1>
          <p className="text-tinta-suave">Consultas rápidas de la comunidad. Un voto por persona.</p>
        </div>
        <MuroCliente tipo="encuesta" accionHref="/encuestas/nueva" accionTexto="Nueva encuesta" />
      </div>
    </PuertaSesion>
  );
}

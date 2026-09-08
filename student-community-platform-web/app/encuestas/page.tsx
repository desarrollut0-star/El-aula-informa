import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Encuestas — El Aula Informa" };

/**
 * La lista ya funciona (feed filtrado por tipo). Votar en una opción
 * necesita endpoints nuevos (`/encuestas/:id/votar`) — pendiente.
 */
export default function Encuestas() {
  return (
    <PuertaSesion titulo="Encuestas de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Encuestas</h1>
          <p className="text-tinta-suave">Consultas rápidas de la comunidad. La votación llega pronto.</p>
        </div>
        <MuroCliente tipo="encuesta" />
      </div>
    </PuertaSesion>
  );
}

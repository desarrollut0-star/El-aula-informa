import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export const metadata = { title: "Muro — El Aula Informa" };

export default function Muro() {
  return (
    <PuertaSesion titulo="El muro de la comunidad">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl">Muro</h1>
          <p className="text-tinta-suave">
            Todo, ordenado por relevancia. En celular, ve a{" "}
            <a href="/swiper" className="underline">/swiper</a> para calificar deslizando.
          </p>
        </div>
        <MuroCliente accionHref="/muro/nuevo" accionTexto="Compartir mi testimonio" />
      </div>
    </PuertaSesion>
  );
}

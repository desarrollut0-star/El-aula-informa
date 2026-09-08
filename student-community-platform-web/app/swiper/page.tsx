import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { SwiperCliente } from "@/components/contenido/SwiperCliente";

export const metadata = { title: "Swiper — El Aula Informa" };

export default function Swiper() {
  return (
    <PuertaSesion titulo="Calificar testimonios">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl">Testimonios</h1>
        <SwiperCliente />
      </div>
    </PuertaSesion>
  );
}

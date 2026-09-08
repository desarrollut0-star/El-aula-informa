import Link from "next/link";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { Boton } from "@/components/ui/Boton";

export const metadata = { title: "Reportes — El Aula Informa" };

/**
 * Fase 3 en el backend (revisión previa manual): esta vista ya puede
 * existir y explicar el proceso mientras el módulo se habilita.
 */
export default function Denuncias() {
  return (
    <PuertaSesion titulo="Reportes de irregularidades">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">Reportes de irregularidades</h1>
        <p className="max-w-prose text-tinta-suave">
          ¿Viste algo mal hecho de parte de la administración (contrataciones raras, malos
          tratos, falta de recursos)? Repórtalo aquí, con evidencia si tienes. Antes de
          publicarse, alguien del equipo lo revisa; y queda marcado como{" "}
          <strong>&laquo;sin confirmar&raquo;</strong> hasta que otros alumnos digan &laquo;yo
          también lo viví / fui testigo&raquo;.
        </p>
        <Link href="/denuncias/nueva">
          <Boton>Reportar una irregularidad</Boton>
        </Link>
      </div>
    </PuertaSesion>
  );
}

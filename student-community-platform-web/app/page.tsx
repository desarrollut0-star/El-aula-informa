"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";
import { AccesosRapidos } from "@/components/inicio/AccesosRapidos";
import { MuroCliente } from "@/components/contenido/MuroCliente";

export default function Portada() {
  const { estado, sesion } = useSesion();

  // --- Visitante: solo información de la institución ---
  if (estado !== "dentro") {
    return (
      <div className="flex flex-col gap-8">
        <section>
          <h1 className="text-4xl md:text-5xl">El Aula Informa</h1>
          <p className="mt-3 max-w-prose text-lg text-tinta-suave">
            Espacio de participación y auditoría de la comunidad estudiantil de la
            Universidad Tecnológica de la Huasteca Hidalguense.
          </p>
        </section>

        <section className="max-w-prose text-sm leading-relaxed text-tinta">
          <p>
            Aquí la comunidad comparte testimonios, se entera de avisos y eventos,
            propone acciones, responde encuestas y reporta irregularidades. Es un
            canal de la propia comunidad estudiantil, independiente.
          </p>
          <p className="mt-3">
            El contenido es para estudiantes de la UTHH. Para verlo y participar,
            inicia sesión con tu correo institucional{" "}
            <span className="whitespace-nowrap">(@uthh.edu.mx)</span>.
          </p>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href="/acceso"
            className="rounded bg-verde px-5 py-2.5 text-sm font-semibold text-blanco-papel hover:bg-verde-oscuro"
          >
            Acceder
          </Link>
          <Link
            href="/nosotros"
            className="rounded border border-borde px-5 py-2.5 text-sm font-semibold hover:bg-papel-alt"
          >
            Conocer más
          </Link>
        </section>

        <section className="border-t border-borde pt-6 text-xs text-tinta-suave">
          <p>Universidad Tecnológica de la Huasteca Hidalguense · Huejutla de Reyes, Hidalgo.</p>
        </section>
      </div>
    );
  }

  // --- Dentro: el muro ---
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-3xl md:text-4xl">
          Hola{sesion?.alias ? `, ${sesion.alias}` : ""}
        </h1>
        <p className="mt-2 max-w-prose text-tinta-suave">
          Lo más reciente y relevante de la comunidad.
        </p>
      </section>

      <section>
        <AccesosRapidos />
      </section>

      <section>
        <h2 className="mb-3 text-2xl">Lo que dice la comunidad</h2>
        <MuroCliente />
      </section>
    </div>
  );
}

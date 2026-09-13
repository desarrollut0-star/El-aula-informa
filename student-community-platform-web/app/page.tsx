"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSesion } from "@/lib/sesion";
import { AccesosRapidos } from "@/components/inicio/AccesosRapidos";
import { MuroCliente } from "@/components/contenido/MuroCliente";
import { clasesBoton } from "@/components/ui/Boton";
import { EsqueletoLista } from "@/components/ui/Esqueleto";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

const RASGOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "cita", titulo: "Testimonios", texto: "Cuenta lo que vives, con tu alias o de forma anónima." },
  { icono: "megafono", titulo: "Avisos y eventos", texto: "Lo oficial de la Sociedad Estudiantil, en un solo lugar." },
  { icono: "escudo", titulo: "Reportes", texto: "Señala irregularidades con el respaldo de la comunidad." },
];

export default function Portada() {
  const { estado, sesion } = useSesion();
  const router = useRouter();

  // Cuenta con sesión pero sin onboarding terminado → completar perfil.
  const faltaOnboarding =
    estado === "dentro" && sesion != null && (!sesion.programaId || !sesion.aceptoTerminos);

  useEffect(() => {
    if (faltaOnboarding) router.replace("/completar-perfil");
  }, [faltaOnboarding, router]);

  if (faltaOnboarding) {
    return <p className="text-tinta-suave">Llevándote a completar tu perfil…</p>;
  }

  // Mientras se resuelve la sesión no se muestra la portada de visitante,
  // para que quien ya entró no vea un parpadeo antes de su muro.
  if (estado === "cargando") {
    return <EsqueletoLista cantidad={2} />;
  }

  // --- Visitante: solo información de la institución ---
  if (estado !== "dentro") {
    return (
      <div className="flex flex-col gap-8">
        <section className="relative overflow-hidden rounded-2xl bg-verde-oscuro px-6 py-12 text-blanco-papel shadow-elevada md:px-12 md:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(154,101,32,0.35),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(169,196,170,0.18),transparent_40%)]"
          />
          <div className="relative max-w-2xl animate-aparecer">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-verde-linea">
              Comunidad estudiantil · UTHH
            </p>
            <h1 className="mt-3 text-4xl text-blanco-papel md:text-6xl">El Aula Informa</h1>
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-blanco-papel/80">
              Espacio de participación y auditoría de la comunidad estudiantil de la Universidad Tecnológica de
              la Huasteca Hidalguense.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/acceso" className={clasesBoton("claro", "px-5 py-2.5")}>
                Acceder
                <Icono nombre="flechaDer" className="h-4 w-4" />
              </Link>
              <Link href="/nosotros" className={clasesBoton("contornoClaro", "px-5 py-2.5")}>
                Conocer más
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {RASGOS.map((r, i) => (
            <div
              key={r.titulo}
              className="tarjeta animate-aparecer p-5"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-verde-tenue text-verde-oscuro">
                <Icono nombre={r.icono} className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-lg">{r.titulo}</h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{r.texto}</p>
            </div>
          ))}
        </section>

        <section className="max-w-prose text-sm leading-relaxed text-tinta">
          <p>
            Aquí la comunidad comparte testimonios, se entera de avisos y eventos, propone acciones, responde
            encuestas y reporta irregularidades. Es un canal de la propia comunidad estudiantil, independiente.
          </p>
          <p className="mt-3">
            El contenido es para estudiantes de la UTHH. Para verlo y participar, inicia sesión con tu correo
            institucional <span className="whitespace-nowrap">(@uthh.edu.mx)</span>.
          </p>
        </section>

        <section className="border-t border-borde/70 pt-6 text-xs text-tinta-suave">
          <p>Universidad Tecnológica de la Huasteca Hidalguense · Huejutla de Reyes, Hidalgo.</p>
        </section>
      </div>
    );
  }

  // --- Dentro: el muro ---
  return (
    <div className="flex flex-col gap-10">
      <section className="animate-aparecer">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocre">Tu comunidad</p>
        <h1 className="mt-1 text-3xl md:text-4xl">Hola{sesion?.alias ? `, ${sesion.alias}` : ""}</h1>
        <p className="mt-2 max-w-prose text-tinta-suave">Lo más reciente y relevante de la comunidad.</p>
      </section>

      <section>
        <AccesosRapidos />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl">Lo que dice la comunidad</h2>
          <Link
            href="/muro"
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-verde transition-colors hover:text-verde-oscuro"
          >
            Ver todo
            <Icono nombre="flechaDer" className="h-4 w-4 transition-transform duration-200 ease-suave group-hover:translate-x-0.5" />
          </Link>
        </div>
        <MuroCliente />
      </section>
    </div>
  );
}

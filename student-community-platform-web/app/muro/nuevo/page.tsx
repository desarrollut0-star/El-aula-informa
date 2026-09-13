"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Colapsable } from "@/components/ui/Colapsable";
import { Icono } from "@/components/ui/Iconos";
import { LimiteDiario } from "@/components/contenido/LimiteDiario";
import { api, ApiError } from "@/lib/api-client";

/** Plantillas rápidas (sección 3 del documento de propuestas): baja fricción para redactar. */
const PLANTILLAS = [
  "Soy de {programa} y este paro me hace perder dinero de mi renta.",
  "Llevo {dias} días sin poder avanzar en mis materias por el paro.",
  "Mi titulación se retrasa por esta situación y me preocupa mucho.",
  "Escribir libremente…",
];

const MAXIMO = 500;

export default function NuevoTestimonio() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ultimoError = useRef<string | null>(null);
  if (error) ultimoError.current = error;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.publicar({ tipo: "testimonio", cuerpo: texto, esAnonimo });
      router.push("/muro");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar. ¿Iniciaste sesión?");
    } finally {
      setEnviando(false);
    }
  }

  const avance = texto.length / MAXIMO;
  const colorContador = texto.length >= MAXIMO ? "text-terracota" : texto.length > MAXIMO * 0.9 ? "text-ocre" : "text-tinta-suave";
  const colorBarra = texto.length >= MAXIMO ? "bg-terracota" : texto.length > MAXIMO * 0.9 ? "bg-ocre" : "bg-verde";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <Link
        href="/muro"
        className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-tinta-suave transition-colors hover:text-verde-oscuro"
      >
        <Icono nombre="flechaIzq" className="h-4 w-4 transition-transform duration-200 ease-suave group-hover:-translate-x-0.5" />
        Volver al muro
      </Link>

      <div>
        <h1 className="text-3xl">Comparte tu testimonio</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
          Elige una plantilla rápida o escribe libremente. Se agrega al muro para que otros alumnos lo califiquen.
        </p>
      </div>

      <LimiteDiario />

      <form onSubmit={enviar} className="tarjeta flex flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">Plantillas</span>
          <div className="flex flex-wrap gap-2">
            {PLANTILLAS.map((p) => {
              const libre = p === PLANTILLAS[3];
              const activa = libre ? false : texto === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setTexto(libre ? "" : p)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${
                    activa
                      ? "border-verde bg-verde-tenue text-verde-oscuro"
                      : "border-borde bg-blanco-papel text-tinta-suave hover:border-verde-linea hover:text-tinta"
                  }`}
                >
                  {p.length > 40 ? p.slice(0, 40) + "…" : p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            required
            minLength={1}
            maxLength={MAXIMO}
            rows={5}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe tu testimonio…"
            className="w-full resize-y border border-borde bg-papel/40 px-3 py-2.5 leading-relaxed placeholder:text-tinta-suave/70"
          />
          <div className="flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-papel-alt">
              <div
                className={`h-full origin-left rounded-full transition-[transform,background-color] duration-300 ease-suave ${colorBarra}`}
                style={{ transform: `scaleX(${Math.min(avance, 1)})` }}
              />
            </div>
            <span className={`text-xs tabular-nums transition-colors ${colorContador}`}>
              {texto.length}/{MAXIMO}
            </span>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde bg-papel-alt/60 p-4 text-sm transition-colors duration-200 has-[:checked]:border-verde-linea has-[:checked]:bg-verde-tenue/60">
          <input
            type="checkbox"
            checked={esAnonimo}
            onChange={(e) => setEsAnonimo(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-borde transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 after:ease-suave peer-checked:bg-verde peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-verde peer-focus-visible:ring-offset-2"
          />
          <span className="leading-relaxed">
            <strong className="text-tinta">Publicar como anónimo.</strong> Si lo activas, ni tu alias ni tu
            programa se muestran a nadie, ni en el muro público ni en el swiper. Si lo dejas apagado, se ve tu
            alias, nunca tu nombre real ni tu correo.
          </span>
        </label>

        <Colapsable abierto={Boolean(error)}>
          <p className="rounded-lg bg-terracota-tenue px-3 py-2 text-sm text-terracota">{ultimoError.current}</p>
        </Colapsable>

        <Boton type="submit" disabled={enviando || !texto.trim()} className="w-full py-2.5">
          {enviando ? "Publicando…" : "Publicar testimonio"}
        </Boton>
      </form>
    </div>
  );
}

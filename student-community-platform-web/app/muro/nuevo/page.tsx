"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { LimiteDiario } from "@/components/contenido/LimiteDiario";
import { api, ApiError } from "@/lib/api-client";

/** Plantillas rápidas (sección 3 del documento de propuestas): baja fricción para redactar. */
const PLANTILLAS = [
  "Soy de {programa} y este paro me hace perder dinero de mi renta.",
  "Llevo {dias} días sin poder avanzar en mis materias por el paro.",
  "Mi titulación se retrasa por esta situación y me preocupa mucho.",
  "Escribir libremente…",
];

export default function NuevoTestimonio() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl">Comparte tu testimonio</h1>
      <p className="mt-1 text-sm text-tinta-suave">
        Elige una plantilla rápida o escribe libremente. Se agrega al muro para que otros
        alumnos lo califiquen.
      </p>

      <div className="mt-4"><LimiteDiario /></div>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {PLANTILLAS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setTexto(p === PLANTILLAS[3] ? "" : p)}
              className="border border-borde bg-blanco-papel px-3 py-1.5 text-xs hover:bg-papel-alt"
            >
              {p.length > 40 ? p.slice(0, 40) + "…" : p}
            </button>
          ))}
        </div>

        <textarea
          required
          minLength={1}
          maxLength={500}
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu testimonio…"
          className="border border-borde bg-blanco-papel px-3 py-2"
        />
        <p className="text-right text-xs text-tinta-suave">{texto.length}/500</p>

        <label className="flex items-start gap-2 border border-borde bg-papel-alt p-3 text-sm">
          <input
            type="checkbox"
            checked={esAnonimo}
            onChange={(e) => setEsAnonimo(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <strong>Publicar como anónimo.</strong> Si lo marcas, ni tu alias ni tu programa se
            muestran a nadie — ni en el muro público ni en el swiper. Si lo dejas sin marcar, se
            ve tu alias (nunca tu nombre real ni tu correo).
          </span>
        </label>

        {error && <p className="text-sm text-terracota">{error}</p>}

        <Boton type="submit" disabled={enviando}>
          {enviando ? "Publicando…" : "Publicar testimonio"}
        </Boton>
      </form>
    </div>
  );
}

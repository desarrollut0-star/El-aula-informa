"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Iconos";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { LimiteDiario } from "@/components/contenido/LimiteDiario";
import { api, ApiError } from "@/lib/api-client";

const MAX_OPCIONES = 6;
const MIN_OPCIONES = 2;

export default function NuevaEncuesta() {
  const router = useRouter();
  const [pregunta, setPregunta] = useState("");
  const [opciones, setOpciones] = useState(["", ""]);
  const [cierra, setCierra] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarOpcion(i: number, valor: string) {
    setOpciones((prev) => prev.map((o, idx) => (idx === i ? valor : o)));
  }

  function agregarOpcion() {
    if (opciones.length >= MAX_OPCIONES) return;
    setOpciones((prev) => [...prev, ""]);
  }

  function quitarOpcion(i: number) {
    if (opciones.length <= MIN_OPCIONES) return;
    setOpciones((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpias = opciones.map((o) => o.trim()).filter(Boolean);
    if (limpias.length < MIN_OPCIONES) {
      setError(`Agrega al menos ${MIN_OPCIONES} opciones.`);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await api.publicarEncuesta({
        cuerpo: pregunta,
        // <input type="datetime-local"> da "2026-09-12T10:00"; a ISO con zona.
        cierraEn: new Date(cierra).toISOString(),
        opciones: limpias,
      });
      router.push("/encuestas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar. ¿Iniciaste sesión?");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PuertaSesion titulo="Nueva encuesta">
      <form onSubmit={enviar} className="mx-auto flex max-w-lg flex-col gap-4">
        <h1 className="text-3xl">Nueva encuesta</h1>
        <LimiteDiario />
        <p className="text-sm text-tinta-suave">
          Una consulta rápida a la comunidad. Cada quien vota una sola vez (puede cambiar su voto mientras siga
          abierta).
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Pregunta
          <textarea
            required
            rows={2}
            maxLength={2000}
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Ej. ¿En qué horario prefieres la asamblea?"
            className="resize-y border border-borde bg-blanco-papel px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Opciones ({MIN_OPCIONES}-{MAX_OPCIONES})</span>
          {opciones.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                required
                maxLength={120}
                value={o}
                onChange={(e) => cambiarOpcion(i, e.target.value)}
                placeholder={`Opción ${i + 1}`}
                className="flex-1 border border-borde bg-blanco-papel px-3 py-2 text-sm"
              />
              {opciones.length > MIN_OPCIONES && (
                <button
                  type="button"
                  onClick={() => quitarOpcion(i)}
                  aria-label="Quitar opción"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-tinta-suave transition-colors hover:bg-terracota-tenue hover:text-terracota"
                >
                  <Icono nombre="basura" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {opciones.length < MAX_OPCIONES && (
            <button
              type="button"
              onClick={agregarOpcion}
              className="w-fit text-sm font-medium text-verde-oscuro hover:underline"
            >
              + Agregar opción
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Cierra el
          <input
            type="datetime-local"
            required
            value={cierra}
            onChange={(e) => setCierra(e.target.value)}
            className="border border-borde bg-blanco-papel px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-terracota">{error}</p>}

        <Boton type="submit" disabled={enviando}>
          {enviando ? "Publicando…" : "Publicar encuesta"}
        </Boton>
      </form>
    </PuertaSesion>
  );
}

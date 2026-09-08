"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { api, ApiError } from "@/lib/api-client";

export default function NuevoEvento() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.publicar({
        tipo: "evento",
        titulo,
        cuerpo,
        // <input type="datetime-local"> da "2026-09-12T10:00"; a ISO con zona.
        fechaEvento: fecha ? new Date(fecha).toISOString() : undefined,
        lugar: lugar || undefined,
      });
      router.push("/eventos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar. ¿Iniciaste sesión?");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PuertaSesion titulo="Publicar un evento">
      <form onSubmit={enviar} className="mx-auto flex max-w-lg flex-col gap-4">
        <h1 className="text-3xl">Nuevo evento</h1>
        <p className="text-sm text-tinta-suave">
          Una asamblea, marcha o actividad de la comunidad. Indica cuándo y dónde.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Título
          <input
            required
            maxLength={140}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Asamblea general estudiantil"
            className="border border-borde bg-blanco-papel px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Fecha y hora
            <input
              type="datetime-local"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-borde bg-blanco-papel px-3 py-2"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Lugar
            <input
              required
              maxLength={160}
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej. Explanada principal, UTHH"
              className="border border-borde bg-blanco-papel px-3 py-2"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Detalles
          <textarea
            required
            rows={5}
            maxLength={2000}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            placeholder="Qué se va a tratar, quién convoca, qué llevar…"
            className="border border-borde bg-blanco-papel px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-terracota">{error}</p>}

        <Boton type="submit" disabled={enviando}>
          {enviando ? "Publicando…" : "Publicar evento"}
        </Boton>
      </form>
    </PuertaSesion>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { LimiteDiario } from "@/components/contenido/LimiteDiario";
import { api, ApiError } from "@/lib/api-client";

export default function NuevaPropuesta() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.publicar({ tipo: "propuesta", titulo, cuerpo });
      router.push("/propuestas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar. ¿Iniciaste sesión?");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-3xl">Nueva propuesta</h1>
      <LimiteDiario />
      <p className="text-sm text-tinta-suave">
        Plantea una acción concreta para que la comunidad la apoye (ej. una asamblea, una carta
        abierta, una jornada de apoyo).
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Título
        <input
          required
          maxLength={140}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Asamblea general el viernes"
          className="border border-borde bg-blanco-papel px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Detalles
        <textarea
          required
          rows={5}
          maxLength={2000}
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          placeholder="Explica tu propuesta: qué, cuándo, por qué."
          className="border border-borde bg-blanco-papel px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-terracota">{error}</p>}

      <Boton type="submit" disabled={enviando}>
        {enviando ? "Publicando…" : "Publicar propuesta"}
      </Boton>
    </form>
  );
}

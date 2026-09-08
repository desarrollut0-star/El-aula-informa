"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { api, ApiError } from "@/lib/api-client";
import type { Categoria } from "@/lib/tipos";

export default function NuevaDenuncia() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [texto, setTexto] = useState("");
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.categoriasDenuncia()
      .then((r) => {
        setCategorias(r.categorias);
        setCategoriaId(r.categorias[0]?.id ?? "");
      })
      .catch(() => setCategorias([]));
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      // TODO: subir evidencia a Supabase Storage (bucket privado) y enlazarla.
      await api.crearDenuncia(categoriaId, texto, esAnonimo);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar. ¿Iniciaste sesión?");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return <p className="text-verde-oscuro">Tu reporte quedó en revisión. Te avisaremos cuando se publique.</p>;
  }

  return (
    <form onSubmit={enviar} className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-3xl">Reportar una irregularidad</h1>
      <p className="text-sm text-tinta-suave">
        Cuéntanos qué pasó, con el mayor detalle posible. Alguien del equipo lo revisa antes de publicarlo.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Categoría
        <select
          required
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="border border-borde bg-blanco-papel px-3 py-2"
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Descripción (mínimo 20 caracteres)
        <textarea
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Describe qué ocurrió, cuándo y quién estuvo involucrado."
          className="border border-borde bg-blanco-papel px-3 py-2"
        />
      </label>

      <label className="flex items-start gap-2 border border-borde bg-papel-alt p-3 text-sm">
        <input type="checkbox" checked={esAnonimo} onChange={(e) => setEsAnonimo(e.target.checked)} className="mt-0.5" />
        <span><strong>Reportar como anónimo.</strong> Tu alias no se muestra en la denuncia publicada.</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Evidencia (opcional — todavía no se sube, solo el texto)
        <input type="file" accept="image/*,application/pdf" disabled />
      </label>

      {error && <p className="text-sm text-terracota">{error}</p>}
      <Boton type="submit" disabled={enviando || !categoriaId}>
        {enviando ? "Enviando…" : "Enviar reporte"}
      </Boton>
    </form>
  );
}

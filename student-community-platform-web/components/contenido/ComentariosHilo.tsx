"use client";

import { useEffect, useState } from "react";
import type { Comentario as TComentario } from "@/lib/tipos";
import { api, ApiError } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { haceCuanto } from "@/lib/fechas";
import { AvatarAlias } from "./AvatarAlias";
import { Boton } from "@/components/ui/Boton";

export function ComentariosHilo({ contenidoId }: { contenidoId: string }) {
  const { puedeInteractuar } = useSesion();
  const [lista, setLista] = useState<TComentario[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    api
      .comentarios(contenidoId)
      .then((r) => vivo && setLista(r.comentarios))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, [contenidoId]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      const nuevo = await api.comentar(contenidoId, texto.trim());
      setLista((prev) => [...(prev ?? []), nuevo]);
      setTexto("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo comentar.");
    } finally {
      setEnviando(false);
    }
  }

  function reemplazar(c: TComentario) {
    setLista((prev) => (prev ?? []).map((x) => (x.id === c.id ? c : x)));
  }
  function quitar(id: string) {
    setLista((prev) => (prev ?? []).filter((x) => x.id !== id));
  }

  const raiz = (lista ?? []).filter((c) => !c.padreId);
  const respuestasDe = (id: string) => (lista ?? []).filter((c) => c.padreId === id);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl">Comentarios {lista ? `(${lista.length})` : ""}</h2>

      {puedeInteractuar ? (
        <form onSubmit={enviar} className="flex flex-col gap-2">
          <textarea
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Escribe un comentario…"
            className="border border-borde bg-blanco-papel px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-terracota">{error}</p>}
          <div>
            <Boton type="submit" disabled={enviando || !texto.trim()}>
              {enviando ? "Publicando…" : "Comentar"}
            </Boton>
          </div>
        </form>
      ) : (
        <p className="text-sm text-tinta-suave">Inicia sesión con tu cuenta verificada para comentar.</p>
      )}

      {lista === null ? (
        <p className="text-tinta-suave">Cargando comentarios…</p>
      ) : raiz.length === 0 ? (
        <p className="text-tinta-suave">Todavía no hay comentarios. Sé el primero.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {raiz.map((c) => (
            <li key={c.id}>
              <Comentario c={c} contenidoId={contenidoId} onEditado={reemplazar} onEliminado={quitar} />
              {respuestasDe(c.id).length > 0 && (
                <ul className="mt-3 flex flex-col gap-3 border-l-2 border-borde pl-4">
                  {respuestasDe(c.id).map((r) => (
                    <li key={r.id}>
                      <Comentario c={r} contenidoId={contenidoId} onEditado={reemplazar} onEliminado={quitar} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Comentario({
  c,
  contenidoId,
  onEditado,
  onEliminado,
}: {
  c: TComentario;
  contenidoId: string;
  onEditado: (c: TComentario) => void;
  onEliminado: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(c.cuerpo);
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    setOcupado(true);
    try {
      const actualizado = await api.editarComentario(contenidoId, c.id, texto.trim());
      onEditado({ ...c, ...actualizado, esMio: true });
      setEditando(false);
    } catch {
      /* noop */
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar tu comentario?")) return;
    setOcupado(true);
    try {
      await api.eliminarComentario(contenidoId, c.id);
      onEliminado(c.id);
    } catch {
      setOcupado(false);
    }
  }

  return (
    <div className="flex gap-3">
      <AvatarAlias alias={c.autorAlias} anonimo={false} oficial={c.autorOficial} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-tinta-suave">
          <span className="font-semibold text-verde-oscuro">
            {c.autorOficial ? "Sociedad Estudiantil" : c.autorAlias}
          </span>
          {c.esRespuestaOficial && (
            <span className="rounded bg-verde-oscuro px-1.5 py-0.5 text-[10px] font-bold uppercase text-blanco-papel">
              Respuesta oficial
            </span>
          )}
          {!c.autorOficial && c.autorPrograma && <span>· {c.autorPrograma}</span>}
          <span>· {haceCuanto(c.creadoEn)}</span>
          {c.editadoEn && <span>· editado</span>}
        </div>

        {editando ? (
          <div className="mt-1 flex flex-col gap-2">
            <textarea
              value={texto}
              onChange={(ev) => setTexto(ev.target.value)}
              rows={3}
              maxLength={2000}
              className="border border-borde bg-blanco-papel px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Boton onClick={guardar} disabled={ocupado || !texto.trim()}>Guardar</Boton>
              <Boton variante="secundario" onClick={() => { setEditando(false); setTexto(c.cuerpo); }}>
                Cancelar
              </Boton>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 whitespace-pre-line text-sm text-tinta">{c.cuerpo}</p>
            {c.esMio && (
              <div className="mt-1 flex gap-3 text-xs">
                <button onClick={() => setEditando(true)} className="text-tinta-suave underline hover:text-verde">
                  Editar
                </button>
                <button onClick={eliminar} disabled={ocupado} className="text-terracota underline">
                  Eliminar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, type ButtonHTMLAttributes } from "react";
import type { Comentario as TComentario } from "@/lib/tipos";
import { api, ApiError } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { haceCuanto } from "@/lib/fechas";
import { AvatarAlias } from "./AvatarAlias";
import { CajaComentario } from "./CajaComentario";
import { Colapsable } from "@/components/ui/Colapsable";
import { EsqueletoComentarios } from "@/components/ui/Esqueleto";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

/** El backend manda mensajes útiles, por ejemplo cuando la moderación rechaza un texto. */
function mensajeDe(err: unknown, porDefecto: string) {
  return err instanceof ApiError ? err.message : porDefecto;
}

export function ComentariosHilo({ contenidoId }: { contenidoId: string }) {
  const { puedeInteractuar } = useSesion();
  const [lista, setLista] = useState<TComentario[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hilos con las respuestas desplegadas.
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());

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

  /**
   * Tras publicar se vuelve a pedir la lista: el backend responde con la fila
   * cruda (sin alias ni `esMio`), y así el comentario nuevo aparece con su
   * autor y sus botones. Si falla la recarga, se agrega lo que haya.
   */
  const incorporar = useCallback(
    async (nuevo: TComentario) => {
      try {
        const r = await api.comentarios(contenidoId);
        setLista(r.comentarios);
      } catch {
        setLista((prev) => [...(prev ?? []), nuevo]);
      }
    },
    [contenidoId],
  );

  async function enviar() {
    const cuerpo = texto.trim();
    if (!cuerpo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const nuevo = await api.comentar(contenidoId, cuerpo);
      setTexto("");
      await incorporar(nuevo);
    } catch (err) {
      setError(mensajeDe(err, "No se pudo comentar."));
    } finally {
      setEnviando(false);
    }
  }

  function alternar(id: string) {
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  async function respondida(nueva: TComentario, raizId: string) {
    setAbiertos((prev) => (prev.has(raizId) ? prev : new Set(prev).add(raizId)));
    await incorporar(nueva);
  }

  const reemplazar = (c: TComentario) => setLista((prev) => (prev ?? []).map((x) => (x.id === c.id ? c : x)));
  const quitar = (id: string) => setLista((prev) => (prev ?? []).filter((x) => x.id !== id && x.padreId !== id));

  const raiz = (lista ?? []).filter((c) => !c.padreId);
  const respuestasDe = (id: string) =>
    (lista ?? []).filter((c) => c.padreId === id).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));

  return (
    <section className="tarjeta flex flex-col gap-5 p-5 md:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl">Comentarios</h2>
        {lista && <span className="text-sm tabular-nums text-tinta-suave">{lista.length}</span>}
      </div>

      {lista === null ? (
        <EsqueletoComentarios />
      ) : raiz.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-tinta-suave">
          <Icono nombre="comentario" className="h-6 w-6 text-verde-linea" />
          Todavía no hay comentarios. Sé el primero.
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {raiz.map((c) => {
            const respuestas = respuestasDe(c.id);
            const abierto = abiertos.has(c.id);
            return (
              <li key={c.id} className="animate-aparecer">
                <Comentario
                  c={c}
                  raizId={c.id}
                  contenidoId={contenidoId}
                  puedeInteractuar={puedeInteractuar}
                  onRespondida={respondida}
                  onEditado={reemplazar}
                  onEliminado={quitar}
                />

                {respuestas.length > 0 && (
                  <div className="ml-[15px] mt-2 border-l-2 border-verde-tenue pl-[27px]">
                    <button
                      type="button"
                      onClick={() => alternar(c.id)}
                      aria-expanded={abierto}
                      aria-controls={`respuestas-${c.id}`}
                      className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-verde transition-colors hover:bg-verde-tenue/60 hover:text-verde-oscuro"
                    >
                      <Icono
                        nombre="chevron"
                        grosor={2.2}
                        className={`h-3.5 w-3.5 transition-transform duration-300 ease-suave ${abierto ? "rotate-180" : ""}`}
                      />
                      {abierto
                        ? "Ocultar respuestas"
                        : `Ver ${respuestas.length} ${respuestas.length === 1 ? "respuesta" : "respuestas"}`}
                    </button>

                    <Colapsable abierto={abierto} id={`respuestas-${c.id}`}>
                      <ul className="flex flex-col gap-4 pb-1 pt-3">
                        {respuestas.map((r) => (
                          <li key={r.id} className="animate-aparecer">
                            <Comentario
                              c={r}
                              raizId={c.id}
                              contenidoId={contenidoId}
                              puedeInteractuar={puedeInteractuar}
                              onRespondida={respondida}
                              onEditado={reemplazar}
                              onEliminado={quitar}
                            />
                          </li>
                        ))}
                      </ul>
                    </Colapsable>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {puedeInteractuar ? (
        // Pegada abajo mientras lees los comentarios, como en Facebook. En
        // celular queda justo encima de la barra de navegación inferior.
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-5 -mb-5 rounded-b-xl border-t border-borde/60 bg-blanco-papel px-5 py-3 md:bottom-0 md:-mx-6 md:-mb-6 md:px-6">
          <CajaComentario
            valor={texto}
            onCambio={(v) => {
              setTexto(v);
              if (error) setError(null);
            }}
            onEnviar={enviar}
            enviando={enviando}
            error={error}
            placeholder="Escribe un comentario…"
          />
        </div>
      ) : (
        <p className="rounded-lg bg-papel-alt/70 px-3 py-2.5 text-sm text-tinta-suave">
          Inicia sesión con tu cuenta verificada para comentar.
        </p>
      )}
    </section>
  );
}

function Comentario({
  c,
  raizId,
  contenidoId,
  puedeInteractuar,
  onRespondida,
  onEditado,
  onEliminado,
}: {
  c: TComentario;
  /** Comentario raíz del hilo (las respuestas se cuelgan siempre de él). */
  raizId: string;
  contenidoId: string;
  puedeInteractuar: boolean;
  onRespondida: (c: TComentario, raizId: string) => Promise<void>;
  onEditado: (c: TComentario) => void;
  onEliminado: (id: string) => void;
}) {
  const esRespuesta = Boolean(c.padreId);
  const [editando, setEditando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [texto, setTexto] = useState(c.cuerpo);
  const [respuesta, setRespuesta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);

  async function guardar() {
    const cuerpo = texto.trim();
    if (!cuerpo || guardando) return;
    if (cuerpo === c.cuerpo) {
      setEditando(false);
      return;
    }
    setGuardando(true);
    setErrorEdicion(null);
    try {
      const actualizado = await api.editarComentario(contenidoId, c.id, cuerpo);
      onEditado({ ...c, ...actualizado, esMio: true });
      setEditando(false);
    } catch (err) {
      setErrorEdicion(mensajeDe(err, "No se pudo guardar."));
    } finally {
      setGuardando(false);
    }
  }

  function cancelarEdicion() {
    setEditando(false);
    setTexto(c.cuerpo);
    setErrorEdicion(null);
  }

  async function eliminar() {
    if (!confirm("¿Eliminar tu comentario?")) return;
    setEliminando(true);
    try {
      await api.eliminarComentario(contenidoId, c.id);
      setSaliendo(true);
      setTimeout(() => onEliminado(c.id), 200);
    } catch {
      setEliminando(false);
    }
  }

  async function enviarRespuesta() {
    const cuerpo = respuesta.trim();
    if (!cuerpo || enviandoRespuesta) return;
    setEnviandoRespuesta(true);
    setErrorRespuesta(null);
    try {
      const nueva = await api.comentar(contenidoId, cuerpo, raizId);
      setRespuesta("");
      setRespondiendo(false);
      await onRespondida(nueva, raizId);
    } catch (err) {
      setErrorRespuesta(mensajeDe(err, "No se pudo responder."));
    } finally {
      setEnviandoRespuesta(false);
    }
  }

  function cancelarRespuesta() {
    setRespondiendo(false);
    setRespuesta("");
    setErrorRespuesta(null);
  }

  function abrirRespuesta() {
    if (respondiendo) {
      cancelarRespuesta();
      return;
    }
    // Al responder a una respuesta, prellenamos con @alias para no perder el hilo.
    setRespuesta(esRespuesta && !c.autorOficial ? `@${c.autorAlias} ` : "");
    setRespondiendo(true);
  }

  const nombre = c.autorOficial ? "Sociedad Estudiantil" : c.autorAlias;

  return (
    <div
      className={`flex gap-3 transition-[opacity,transform] duration-200 ease-suave ${
        saliendo ? "scale-[0.98] opacity-0" : ""
      }`}
    >
      <AvatarAlias alias={c.autorAlias} anonimo={false} oficial={c.autorOficial} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-tinta-suave">
          <span className="text-sm font-semibold text-verde-oscuro">{nombre}</span>
          {c.esRespuestaOficial && (
            <span className="rounded-full bg-verde-oscuro px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blanco-papel">
              Respuesta oficial
            </span>
          )}
          {!c.autorOficial && c.autorPrograma && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{c.autorPrograma}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <time dateTime={c.creadoEn}>{haceCuanto(c.creadoEn)}</time>
          {c.editadoEn && (
            <>
              <span aria-hidden>·</span>
              <span>editado</span>
            </>
          )}
        </div>

        {editando ? (
          <div className="mt-1.5 animate-aparecer">
            <CajaComentario
              sinAvatar
              accion="guardar"
              valor={texto}
              onCambio={(v) => {
                setTexto(v);
                if (errorEdicion) setErrorEdicion(null);
              }}
              onEnviar={guardar}
              onCancelar={cancelarEdicion}
              enviando={guardando}
              error={errorEdicion}
              enfocar
              placeholder="Edita tu comentario…"
            />
          </div>
        ) : (
          <>
            <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-tinta">{c.cuerpo}</p>
            {(puedeInteractuar || c.esMio) && (
              <div className="-ml-2 mt-1 flex flex-wrap items-center gap-0.5">
                {puedeInteractuar && (
                  <AccionComentario icono="respuesta" activa={respondiendo} onClick={abrirRespuesta}>
                    Responder
                  </AccionComentario>
                )}
                {c.esMio && (
                  <>
                    <AccionComentario icono="pluma" onClick={() => setEditando(true)}>
                      Editar
                    </AccionComentario>
                    <AccionComentario icono="basura" peligro onClick={eliminar} disabled={eliminando}>
                      Eliminar
                    </AccionComentario>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <Colapsable abierto={respondiendo}>
          <div className="pt-2">
            <CajaComentario
              tamanoAvatar={24}
              valor={respuesta}
              onCambio={(v) => {
                setRespuesta(v);
                if (errorRespuesta) setErrorRespuesta(null);
              }}
              onEnviar={enviarRespuesta}
              onCancelar={cancelarRespuesta}
              enviando={enviandoRespuesta}
              error={errorRespuesta}
              enfocar={respondiendo}
              placeholder={`Responder a ${nombre}…`}
            />
          </div>
        </Colapsable>
      </div>
    </div>
  );
}

function AccionComentario({
  icono,
  peligro = false,
  activa = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icono: NombreIcono; peligro?: boolean; activa?: boolean }) {
  const tono = peligro
    ? "text-tinta-suave hover:bg-terracota-tenue hover:text-terracota"
    : activa
      ? "bg-verde-tenue text-verde-oscuro"
      : "text-tinta-suave hover:bg-papel-alt hover:text-verde-oscuro";
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 disabled:opacity-50 ${tono}`}
      {...props}
    >
      <Icono nombre={icono} className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarjetaContenido as Tarjeta, TipoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { haceCuanto, fechaEvento } from "@/lib/fechas";
import { NivelPill } from "@/components/ui/NivelPill";
import { BotonReportar } from "@/components/ui/BotonReportar";
import { Boton } from "@/components/ui/Boton";
import { PerfilHoverCard } from "./PerfilHoverCard";

const ESTILO: Record<TipoContenido, { icono: string; etiqueta: string; acento: string; fondo: string }> = {
  testimonio: { icono: "🗣️", etiqueta: "Testimonio", acento: "border-l-verde", fondo: "bg-verde-tenue text-verde-oscuro" },
  aviso: { icono: "📣", etiqueta: "Aviso", acento: "border-l-ocre", fondo: "bg-ocre-tenue text-ocre" },
  evento: { icono: "📅", etiqueta: "Evento", acento: "border-l-verde", fondo: "bg-verde-tenue text-verde-oscuro" },
  novedad: { icono: "📰", etiqueta: "Novedad", acento: "border-l-verde-linea", fondo: "bg-verde-tenue text-verde-oscuro" },
  propuesta: { icono: "💡", etiqueta: "Propuesta", acento: "border-l-terracota", fondo: "bg-terracota-tenue text-terracota" },
  encuesta: { icono: "🗳️", etiqueta: "Encuesta", acento: "border-l-ocre", fondo: "bg-ocre-tenue text-ocre" },
  denuncia: { icono: "📮", etiqueta: "Reporte", acento: "border-l-terracota", fondo: "bg-terracota-tenue text-terracota" },
};

export function TarjetaContenido({
  tarjeta,
  onEliminada,
}: {
  tarjeta: Tarjeta;
  onEliminada?: (id: string) => void;
}) {
  const { puedeInteractuar } = useSesion();
  const e = ESTILO[tarjeta.tipo];
  const esTestimonio = tarjeta.tipo === "testimonio";
  const anonimo = tarjeta.esAnonimo || !tarjeta.autorAlias;
  const oficial = tarjeta.autorOficial;
  const puedoGestionar = Boolean(tarjeta.esMio) && puedeInteractuar;

  const [apoyos, setApoyos] = useState(tarjeta.totalApoyos);
  const [rechazos, setRechazos] = useState(tarjeta.totalRechazos);
  const [miReaccion, setMiReaccion] = useState<boolean | null>(tarjeta.miReaccion ?? null);
  const [ocupado, setOcupado] = useState(false);

  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!menu) return;
    function cerrar(ev: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) setMenu(false);
    }
    function esc(ev: KeyboardEvent) {
      if (ev.key === "Escape") setMenu(false);
    }
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);
  const [titulo, setTitulo] = useState(tarjeta.titulo ?? "");
  const [cuerpo, setCuerpo] = useState(tarjeta.cuerpo);
  const [textoVisible, setTextoVisible] = useState({ titulo: tarjeta.titulo, cuerpo: tarjeta.cuerpo });
  const [eliminado, setEliminado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reaccionar(aFavor: boolean) {
    if (ocupado || !puedeInteractuar) return;
    const previo = miReaccion;
    const destino: boolean | null = previo === aFavor ? null : aFavor;
    setApoyos((n) => n - (previo === true ? 1 : 0) + (destino === true ? 1 : 0));
    setRechazos((n) => n - (previo === false ? 1 : 0) + (destino === false ? 1 : 0));
    setMiReaccion(destino);
    setOcupado(true);
    try {
      await api.reaccionar(tarjeta.id, destino);
    } catch {
      setApoyos(tarjeta.totalApoyos);
      setRechazos(tarjeta.totalRechazos);
      setMiReaccion(previo);
    } finally {
      setOcupado(false);
    }
  }

  async function guardarEdicion() {
    setOcupado(true);
    setError(null);
    try {
      await api.editarContenido(tarjeta.id, {
        cuerpo,
        titulo: esTestimonio ? undefined : titulo || null,
      });
      setTextoVisible({ titulo: esTestimonio ? null : titulo, cuerpo });
      setEditando(false);
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    setOcupado(true);
    try {
      await api.eliminarContenido(tarjeta.id);
      setEliminado(true);
      onEliminada?.(tarjeta.id);
    } catch {
      setError("No se pudo eliminar.");
      setOcupado(false);
    }
  }

  if (eliminado) {
    return (
      <p className="border border-dashed border-borde bg-papel-alt p-4 text-sm text-tinta-suave">
        Eliminaste esta publicación.
      </p>
    );
  }

  const nombre = anonimo ? "Publicación anónima" : oficial ? "Sociedad Estudiantil" : tarjeta.autorAlias!;
  const subtitulo = anonimo ? null : oficial ? "Cuenta oficial" : (tarjeta.autorPrograma ?? "Comunidad UTHH");

  return (
    <article className={`border border-l-4 border-borde bg-blanco-papel p-5 ${e.acento} ${esTestimonio ? "pl-6" : ""}`}>
      <header className="mb-3 flex items-start gap-3">
        <PerfilHoverCard alias={tarjeta.autorAlias} programa={tarjeta.autorPrograma} anonimo={anonimo} oficial={oficial} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={anonimo ? "font-semibold italic text-tinta-suave" : "font-semibold text-verde-oscuro"}>
              {nombre}
            </span>
            {oficial && !anonimo && (
              <span className="rounded bg-verde-oscuro px-1.5 py-0.5 text-[10px] font-bold uppercase text-blanco-papel">
                Oficial
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-tinta-suave">
            {subtitulo && <span>{subtitulo}</span>}
            {subtitulo && <span aria-hidden>·</span>}
            <time dateTime={tarjeta.creadoEn}>{haceCuanto(tarjeta.creadoEn)}</time>
          </div>
        </div>

        <span className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${e.fondo}`}>
          <span aria-hidden>{e.icono}</span> {e.etiqueta}
        </span>

        {puedoGestionar && !editando && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenu((v) => !v)}
              className="rounded px-1.5 text-lg leading-none text-tinta-suave hover:bg-papel-alt"
              aria-label="Opciones"
            >
              ⋯
            </button>
            {menu && (
              <div className="absolute right-0 z-20 mt-1 w-36 rounded border border-borde bg-blanco-papel py-1 text-sm shadow-lg">
                <button
                  onClick={() => { setMenu(false); setEditando(true); }}
                  className="block w-full px-3 py-1.5 text-left hover:bg-papel-alt"
                >
                  Editar
                </button>
                <button
                  onClick={() => { setMenu(false); void eliminar(); }}
                  className="block w-full px-3 py-1.5 text-left text-terracota hover:bg-papel-alt"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {(tarjeta.fijado || tarjeta.noVerificada || tarjeta.categoriaDenuncia || tarjeta.encuestaCerrada) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {tarjeta.fijado && (
            <span className="rounded border border-terracota bg-terracota-tenue px-2 py-0.5 text-[11px] font-bold uppercase text-terracota">
              Fijado
            </span>
          )}
          {tarjeta.categoriaDenuncia && (
            <span className="rounded border border-borde bg-papel-alt px-2 py-0.5 text-[11px] font-bold uppercase text-tinta-suave">
              {tarjeta.categoriaDenuncia}
            </span>
          )}
          {tarjeta.noVerificada && (
            <span className="rounded border border-tinta-suave bg-papel-alt px-2 py-0.5 text-[11px] font-bold uppercase text-tinta-suave">
              Sin confirmar
            </span>
          )}
          {tarjeta.encuestaCerrada && (
            <span className="rounded border border-borde bg-papel-alt px-2 py-0.5 text-[11px] font-bold uppercase text-tinta-suave">
              Encuesta cerrada
            </span>
          )}
          <NivelPill nivel={tarjeta.nivel} />
        </div>
      )}

      {editando ? (
        <div className="flex flex-col gap-2">
          {!esTestimonio && (
            <input
              value={titulo}
              onChange={(ev) => setTitulo(ev.target.value)}
              maxLength={140}
              placeholder="Título"
              className="border border-borde bg-blanco-papel px-3 py-2 text-sm"
            />
          )}
          <textarea
            value={cuerpo}
            onChange={(ev) => setCuerpo(ev.target.value)}
            rows={4}
            maxLength={4000}
            className="border border-borde bg-blanco-papel px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-terracota">{error}</p>}
          <div className="flex gap-2">
            <Boton onClick={guardarEdicion} disabled={ocupado || !cuerpo.trim()}>
              {ocupado ? "Guardando…" : "Guardar"}
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => { setEditando(false); setTitulo(tarjeta.titulo ?? ""); setCuerpo(tarjeta.cuerpo); }}
            >
              Cancelar
            </Boton>
          </div>
        </div>
      ) : (
        <>
          {textoVisible.titulo && !esTestimonio && (
            <h3 className="mb-1 font-display text-xl font-bold text-verde-oscuro">{textoVisible.titulo}</h3>
          )}
          <p className={`whitespace-pre-line text-[15px] leading-relaxed text-tinta ${esTestimonio ? "italic" : ""}`}>
            {esTestimonio ? `“${textoVisible.cuerpo}”` : textoVisible.cuerpo}
          </p>
        </>
      )}

      {(tarjeta.fechaEvento || tarjeta.lugar) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-borde pt-2 text-xs text-tinta-suave">
          {tarjeta.fechaEvento && <span>🗓️ {fechaEvento(tarjeta.fechaEvento)}</span>}
          {tarjeta.lugar && <span>📍 {tarjeta.lugar}</span>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-borde pt-3 text-xs">
        <button
          type="button"
          disabled={!puedeInteractuar || ocupado}
          onClick={() => reaccionar(true)}
          className={`rounded-full border px-2.5 py-1 font-semibold transition-colors disabled:opacity-40 ${
            miReaccion === true ? "border-verde bg-verde text-blanco-papel" : "border-borde text-tinta-suave hover:border-verde"
          }`}
        >
          👍 {apoyos}
        </button>
        <button
          type="button"
          disabled={!puedeInteractuar || ocupado}
          onClick={() => reaccionar(false)}
          className={`rounded-full border px-2.5 py-1 font-semibold transition-colors disabled:opacity-40 ${
            miReaccion === false ? "border-terracota bg-terracota text-blanco-papel" : "border-borde text-tinta-suave hover:border-terracota"
          }`}
        >
          👎 {rechazos}
        </button>
        <Link
          href={`/contenido/${tarjeta.id}`}
          className="rounded-full border border-borde px-2.5 py-1 font-semibold text-tinta-suave hover:border-verde"
        >
          💬 {tarjeta.totalComentarios} · Comentar
        </Link>
        <span className="ml-auto">
          <BotonReportar objetivo="contenido" objetivoId={tarjeta.id} />
        </span>
      </div>

      {!puedeInteractuar && (
        <p className="mt-2 text-[11px] text-tinta-suave">
          Solo lectura. Inicia sesión con tu cuenta verificada para reaccionar y comentar.
        </p>
      )}
    </article>
  );
}

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
import { Colapsable } from "@/components/ui/Colapsable";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";
import { PerfilHoverCard } from "./PerfilHoverCard";

const ESTILO: Record<TipoContenido, { icono: NombreIcono; etiqueta: string; barra: string; chip: string }> = {
  testimonio: { icono: "cita", etiqueta: "Testimonio", barra: "before:bg-verde", chip: "bg-verde-tenue text-verde-oscuro" },
  aviso: { icono: "megafono", etiqueta: "Aviso", barra: "before:bg-ocre", chip: "bg-ocre-tenue text-ocre" },
  evento: { icono: "calendario", etiqueta: "Evento", barra: "before:bg-verde", chip: "bg-verde-tenue text-verde-oscuro" },
  novedad: { icono: "periodico", etiqueta: "Novedad", barra: "before:bg-verde-linea", chip: "bg-verde-tenue text-verde-oscuro" },
  propuesta: { icono: "foco", etiqueta: "Propuesta", barra: "before:bg-terracota", chip: "bg-terracota-tenue text-terracota" },
  encuesta: { icono: "grafica", etiqueta: "Encuesta", barra: "before:bg-ocre", chip: "bg-ocre-tenue text-ocre" },
  denuncia: { icono: "escudo", etiqueta: "Reporte", barra: "before:bg-terracota", chip: "bg-terracota-tenue text-terracota" },
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
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reaccionar(aFavor: boolean) {
    // Se ignoran clics mientras hay una reacción en curso, sin deshabilitar
    // el botón: así no parpadea la opacidad en cada toque.
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
      setSaliendo(true);
      setTimeout(() => {
        setEliminado(true);
        onEliminada?.(tarjeta.id);
      }, 220);
    } catch {
      setError("No se pudo eliminar.");
      setOcupado(false);
    }
  }

  if (eliminado) {
    return (
      <p className="animate-aparecer-suave rounded-xl border border-dashed border-borde bg-papel-alt/60 p-4 text-sm text-tinta-suave">
        Eliminaste esta publicación.
      </p>
    );
  }

  const nombre = anonimo ? "Publicación anónima" : oficial ? "Sociedad Estudiantil" : tarjeta.autorAlias!;
  const subtitulo = anonimo ? null : oficial ? "Cuenta oficial" : (tarjeta.autorPrograma ?? "Comunidad UTHH");

  return (
    <article
      className={`tarjeta relative p-5 transition-[box-shadow,opacity,transform] duration-300 ease-suave hover:shadow-elevada before:absolute before:bottom-5 before:left-0 before:top-5 before:w-[3px] before:rounded-r-full ${e.barra} ${
        saliendo ? "scale-[0.98] opacity-0" : ""
      }`}
    >
      <header className="mb-3 flex items-start gap-3">
        <PerfilHoverCard
          alias={tarjeta.autorAlias}
          programa={tarjeta.autorPrograma}
          anonimo={anonimo}
          oficial={oficial}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={anonimo ? "font-semibold italic text-tinta-suave" : "font-semibold text-verde-oscuro"}>
              {nombre}
            </span>
            {oficial && !anonimo && (
              <span className="rounded-full bg-verde-oscuro px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blanco-papel">
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

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${e.chip}`}
        >
          <Icono nombre={e.icono} className="h-3.5 w-3.5" grosor={2} />
          {e.etiqueta}
        </span>

        {puedoGestionar && !editando && (
          <div ref={menuRef} className="relative -mr-1.5 -mt-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-tinta-suave transition-colors hover:bg-papel-alt hover:text-tinta ${
                menu ? "bg-papel-alt text-tinta" : ""
              }`}
              aria-label="Opciones"
              aria-expanded={menu}
              aria-haspopup="menu"
            >
              <Icono nombre="mas" className="h-5 w-5" grosor={3} />
            </button>
            {menu && (
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 w-40 origin-top-right animate-menu rounded-xl border border-borde/80 bg-blanco-papel p-1 text-sm shadow-flotante"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setEditando(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-papel-alt"
                >
                  <Icono nombre="pluma" className="h-4 w-4 text-tinta-suave" />
                  Editar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    void eliminar();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-terracota transition-colors hover:bg-terracota-tenue"
                >
                  <Icono nombre="basura" className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {(tarjeta.fijado || tarjeta.noVerificada || tarjeta.categoriaDenuncia || tarjeta.encuestaCerrada) && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {tarjeta.fijado && (
            <span className="rounded-full border border-terracota/40 bg-terracota-tenue px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-terracota">
              Fijado
            </span>
          )}
          {tarjeta.categoriaDenuncia && (
            <span className="rounded-full border border-borde bg-papel-alt px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
              {tarjeta.categoriaDenuncia}
            </span>
          )}
          {tarjeta.noVerificada && (
            <span className="rounded-full border border-tinta-suave/40 bg-papel-alt px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
              Sin confirmar
            </span>
          )}
          {tarjeta.encuestaCerrada && (
            <span className="rounded-full border border-borde bg-papel-alt px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
              Encuesta cerrada
            </span>
          )}
          <NivelPill nivel={tarjeta.nivel} />
        </div>
      )}

      {editando ? (
        <div className="flex animate-aparecer flex-col gap-2">
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
            className="resize-y border border-borde bg-blanco-papel px-3 py-2 text-sm leading-relaxed"
          />
          <Colapsable abierto={Boolean(error)}>
            <p className="text-sm text-terracota">{error}</p>
          </Colapsable>
          <div className="flex justify-end gap-2">
            <Boton
              variante="fantasma"
              tamano="chico"
              onClick={() => {
                setEditando(false);
                setTitulo(tarjeta.titulo ?? "");
                setCuerpo(tarjeta.cuerpo);
                setError(null);
              }}
            >
              Cancelar
            </Boton>
            <Boton tamano="chico" onClick={guardarEdicion} disabled={ocupado || !cuerpo.trim()}>
              {ocupado ? "Guardando…" : "Guardar cambios"}
            </Boton>
          </div>
        </div>
      ) : (
        <>
          {textoVisible.titulo && !esTestimonio && (
            <h3 className="mb-1.5 text-xl leading-snug">{textoVisible.titulo}</h3>
          )}
          {esTestimonio ? (
            <blockquote className="relative pl-6 text-[15px] italic leading-relaxed text-tinta">
              <Icono nombre="cita" className="absolute left-0 top-1 h-4 w-4 text-verde-linea" grosor={2.2} />
              <span className="whitespace-pre-line break-words">{textoVisible.cuerpo}</span>
            </blockquote>
          ) : (
            <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-tinta">
              {textoVisible.cuerpo}
            </p>
          )}
        </>
      )}

      {(tarjeta.fechaEvento || tarjeta.lugar) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tarjeta.fechaEvento && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-papel-alt/70 px-2.5 py-1.5 text-xs text-tinta">
              <Icono nombre="calendario" className="h-3.5 w-3.5 text-verde" />
              {fechaEvento(tarjeta.fechaEvento)}
            </span>
          )}
          {tarjeta.lugar && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-papel-alt/70 px-2.5 py-1.5 text-xs text-tinta">
              <Icono nombre="ubicacion" className="h-3.5 w-3.5 text-verde" />
              {tarjeta.lugar}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-borde/70 pt-3">
        <Reaccion
          tipo="apoyo"
          activa={miReaccion === true}
          cuenta={apoyos}
          deshabilitada={!puedeInteractuar}
          onClick={() => reaccionar(true)}
        />
        <Reaccion
          tipo="rechazo"
          activa={miReaccion === false}
          cuenta={rechazos}
          deshabilitada={!puedeInteractuar}
          onClick={() => reaccionar(false)}
        />
        <Link
          href={`/contenido/${tarjeta.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-borde px-3 py-1.5 text-xs font-semibold text-tinta-suave transition-colors duration-200 hover:border-verde hover:text-verde"
        >
          <Icono nombre="comentario" className="h-4 w-4" />
          <span className="tabular-nums">{tarjeta.totalComentarios}</span>
          <span className="hidden sm:inline">Comentarios</span>
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

function Reaccion({
  tipo,
  activa,
  cuenta,
  deshabilitada,
  onClick,
}: {
  tipo: "apoyo" | "rechazo";
  activa: boolean;
  cuenta: number;
  deshabilitada: boolean;
  onClick: () => void;
}) {
  const apoyo = tipo === "apoyo";
  const tono = activa
    ? apoyo
      ? "border-verde bg-verde text-blanco-papel"
      : "border-terracota bg-terracota text-blanco-papel"
    : apoyo
      ? "border-borde text-tinta-suave hover:border-verde hover:text-verde"
      : "border-borde text-tinta-suave hover:border-terracota hover:text-terracota";

  return (
    <button
      type="button"
      disabled={deshabilitada}
      onClick={onClick}
      aria-pressed={activa}
      aria-label={apoyo ? `Apoyar (${cuenta})` : `Rechazar (${cuenta})`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color,color,transform] duration-200 ease-suave active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 ${tono}`}
    >
      <Icono nombre="pulgar" className={`h-4 w-4 ${apoyo ? "" : "rotate-180"}`} />
      <span key={cuenta} className="inline-block animate-conteo tabular-nums">
        {cuenta}
      </span>
    </button>
  );
}

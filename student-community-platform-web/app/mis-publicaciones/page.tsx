"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MiPublicacion, EstadoContenido } from "@/lib/tipos";
import { api } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { haceCuanto } from "@/lib/fechas";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { ESTILO as ESTILO_TIPO } from "@/components/contenido/TarjetaContenido";
import { clasesBoton } from "@/components/ui/Boton";
import { Colapsable } from "@/components/ui/Colapsable";
import { EsqueletoLista } from "@/components/ui/Esqueleto";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

const ESTADO: Record<EstadoContenido, { txt: string; punto: string; chip: string; ayuda: string }> = {
  visible: { txt: "Publicada", punto: "bg-verde", chip: "bg-verde-tenue text-verde-oscuro", ayuda: "Visible en el muro." },
  en_revision: {
    txt: "En revisión",
    punto: "bg-ocre",
    chip: "bg-ocre-tenue text-ocre",
    ayuda: "El equipo la está revisando antes de publicarla.",
  },
  oculto: {
    txt: "Oculta",
    punto: "bg-tinta-suave",
    chip: "bg-papel-alt text-tinta-suave",
    ayuda: "Se ocultó por reportes de la comunidad o por moderación.",
  },
  rechazado: {
    txt: "Rechazada",
    punto: "bg-terracota",
    chip: "bg-terracota-tenue text-terracota",
    ayuda: "No cumplió con el código de conducta.",
  },
};

type Filtro = "todas" | EstadoContenido;

const FILTROS: { clave: Filtro; txt: string }[] = [
  { clave: "todas", txt: "Todas" },
  { clave: "visible", txt: "Publicadas" },
  { clave: "en_revision", txt: "En revisión" },
  { clave: "oculto", txt: "Ocultas" },
  { clave: "rechazado", txt: "Rechazadas" },
];

export default function MisPublicaciones() {
  return (
    <PuertaSesion titulo="Mis publicaciones">
      <Contenido />
    </PuertaSesion>
  );
}

function Contenido() {
  const { puedeInteractuar } = useSesion();
  const [items, setItems] = useState<MiPublicacion[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [borrando, setBorrando] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .misPublicaciones()
      .then((r) => setItems(r.publicaciones))
      .catch(() => setItems([]));
  }, []);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    setBorrando(id);
    setError(null);
    try {
      await api.eliminarContenido(id);
      setSaliendo((prev) => new Set(prev).add(id));
      setTimeout(() => setItems((prev) => (prev ?? []).filter((p) => p.id !== id)), 220);
    } catch {
      setError("No se pudo eliminar la publicación. Intenta de nuevo.");
    } finally {
      setBorrando(null);
    }
  }

  const lista = items ?? [];
  const cuenta = (e: EstadoContenido) => lista.filter((p) => p.estado === e).length;
  const visibles = filtro === "todas" ? lista : lista.filter((p) => p.estado === filtro);
  const filtrosDisponibles = FILTROS.filter((f) => f.clave === "todas" || cuenta(f.clave) > 0);
  const apoyos = lista.reduce((n, p) => n + p.totalApoyos, 0);
  const comentarios = lista.reduce((n, p) => n + p.totalComentarios, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Mis publicaciones</h1>
          <p className="mt-1 text-sm text-tinta-suave">Todo lo que has compartido, con su estado y su recepción.</p>
        </div>
        {puedeInteractuar && (
          <Link href="/muro/nuevo" className={clasesBoton("primario")}>
            <Icono nombre="pluma" />
            Nueva publicación
          </Link>
        )}
      </div>

      {items === null ? (
        <EsqueletoLista cantidad={2} />
      ) : lista.length === 0 ? (
        <div className="tarjeta flex animate-aparecer flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-verde-tenue text-verde-oscuro">
            <Icono nombre="pluma" className="h-5 w-5" />
          </span>
          <p className="font-semibold text-verde-oscuro">Todavía no has publicado nada</p>
          <p className="max-w-sm text-sm text-tinta-suave">
            Comparte un testimonio o una propuesta. Aquí verás cómo va cada publicación.
          </p>
          {puedeInteractuar && (
            <Link href="/muro/nuevo" className={clasesBoton("primario", "mt-3")}>
              Compartir testimonio
            </Link>
          )}
        </div>
      ) : (
        <>
          <section className="grid animate-aparecer grid-cols-3 gap-3">
            <Dato icono="lista" valor={lista.length} etiqueta={lista.length === 1 ? "Publicación" : "Publicaciones"} />
            <Dato icono="pulgar" valor={apoyos} etiqueta={apoyos === 1 ? "Apoyo recibido" : "Apoyos recibidos"} />
            <Dato icono="comentario" valor={comentarios} etiqueta={comentarios === 1 ? "Comentario" : "Comentarios"} />
          </section>

          {filtrosDisponibles.length > 2 && (
            <div
              role="group"
              aria-label="Filtrar por estado"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {filtrosDisponibles.map((f) => {
                const activo = filtro === f.clave;
                const n = f.clave === "todas" ? lista.length : cuenta(f.clave);
                return (
                  <button
                    key={f.clave}
                    type="button"
                    onClick={() => setFiltro(f.clave)}
                    aria-pressed={activo}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      activo
                        ? "border-verde-oscuro bg-verde-oscuro text-blanco-papel"
                        : "border-borde bg-blanco-papel text-tinta-suave hover:border-verde-linea hover:text-tinta"
                    }`}
                  >
                    {f.txt}
                    <span
                      className={`rounded-full px-1.5 text-xs tabular-nums ${activo ? "bg-blanco-papel/20" : "bg-papel-alt"}`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <Colapsable abierto={Boolean(error)}>
            <p className="rounded-lg bg-terracota-tenue px-3 py-2 text-sm text-terracota">{error}</p>
          </Colapsable>

          {visibles.length === 0 ? (
            <p className="tarjeta p-6 text-center text-sm text-tinta-suave">No hay publicaciones en este estado.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visibles.map((p, i) => {
                const est = ESTADO[p.estado];
                const tipo = ESTILO_TIPO[p.tipo];
                const sale = saliendo.has(p.id);
                return (
                  <li
                    key={p.id}
                    className={`tarjeta p-4 transition-[opacity,transform] duration-200 ease-suave md:p-5 ${
                      sale ? "scale-[0.98] opacity-0" : "animate-aparecer"
                    }`}
                    style={sale ? undefined : { animationDelay: `${Math.min(i, 5) * 40}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tipo.chip}`}
                      >
                        <Icono nombre={tipo.icono} className="h-3.5 w-3.5" grosor={2} />
                        {tipo.etiqueta}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${est.chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${est.punto}`} aria-hidden />
                        {est.txt}
                      </span>
                      {p.esAnonimo && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-borde px-2.5 py-1 text-[11px] font-medium text-tinta-suave">
                          <Icono nombre="usuario" className="h-3 w-3" />
                          Anónima
                        </span>
                      )}
                      <time dateTime={p.creadoEn} className="ml-auto text-xs text-tinta-suave">
                        {haceCuanto(p.creadoEn)}
                      </time>
                    </div>

                    {p.titulo && <h2 className="mt-3 text-lg leading-snug">{p.titulo}</h2>}
                    <p
                      className={`${p.titulo ? "mt-1" : "mt-3"} line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-tinta ${
                        p.tipo === "testimonio" ? "italic" : ""
                      }`}
                    >
                      {p.cuerpo}
                    </p>
                    {p.estado !== "visible" && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-tinta-suave">
                        <Icono nombre="escudo" className="h-3.5 w-3.5" />
                        {est.ayuda}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borde/70 pt-3 text-xs text-tinta-suave">
                      <span className="inline-flex items-center gap-1.5 tabular-nums" title="Apoyos">
                        <Icono nombre="pulgar" className="h-4 w-4" />
                        {p.totalApoyos}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums" title="Rechazos">
                        <Icono nombre="pulgar" className="h-4 w-4 rotate-180" />
                        {p.totalRechazos}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums" title="Comentarios">
                        <Icono nombre="comentario" className="h-4 w-4" />
                        {p.totalComentarios}
                      </span>
                      <span className="ml-auto flex items-center gap-1">
                        {p.estado === "visible" && (
                          <Link
                            href={`/contenido/${p.id}`}
                            className="group inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-verde transition-colors hover:bg-verde-tenue"
                          >
                            Ver y editar
                            <Icono
                              nombre="flechaDer"
                              className="h-3.5 w-3.5 transition-transform duration-200 ease-suave group-hover:translate-x-0.5"
                            />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => eliminar(p.id)}
                          disabled={borrando === p.id}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-tinta-suave transition-colors hover:bg-terracota-tenue hover:text-terracota disabled:opacity-50"
                        >
                          <Icono nombre="basura" className="h-3.5 w-3.5" />
                          {borrando === p.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Dato({ icono, valor, etiqueta }: { icono: NombreIcono; valor: number; etiqueta: string }) {
  return (
    <div className="tarjeta flex items-center gap-3 p-3 sm:p-4">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-verde-tenue text-verde-oscuro sm:flex">
        <Icono nombre={icono} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold leading-none tabular-nums text-verde-oscuro">{valor}</p>
        <p className="mt-1 truncate text-xs text-tinta-suave">{etiqueta}</p>
      </div>
    </div>
  );
}

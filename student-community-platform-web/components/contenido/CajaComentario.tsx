"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useSesion } from "@/lib/sesion";
import { AvatarAlias } from "./AvatarAlias";
import { Colapsable } from "@/components/ui/Colapsable";
import { Icono } from "@/components/ui/Iconos";

const useLayoutEffectSeguro = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** A partir de esta altura la caja deja de crecer y hace scroll por dentro. */
const ALTO_MAXIMO = 160;
/** Alto de la burbuja con una sola línea: sirve para centrar el avatar. */
const ALTO_BURBUJA = 46;

/**
 * Caja para escribir comentarios al estilo de Facebook: una burbuja de una
 * línea que crece mientras escribes, con el botón de enviar adentro.
 * Enter envía, Shift+Enter hace salto de línea y Esc cancela.
 * Se usa para comentar, responder y editar.
 */
export function CajaComentario({
  valor,
  onCambio,
  onEnviar,
  onCancelar,
  enviando = false,
  error = null,
  placeholder = "Escribe un comentario…",
  accion = "enviar",
  tamanoAvatar = 32,
  sinAvatar = false,
  enfocar = false,
  maximo = 2000,
}: {
  valor: string;
  onCambio: (valor: string) => void;
  onEnviar: () => void;
  onCancelar?: () => void;
  enviando?: boolean;
  error?: string | null;
  placeholder?: string;
  accion?: "enviar" | "guardar";
  tamanoAvatar?: number;
  sinAvatar?: boolean;
  enfocar?: boolean;
  maximo?: number;
}) {
  const { sesion } = useSesion();
  const ref = useRef<HTMLTextAreaElement>(null);
  const puedeEnviar = valor.trim().length > 0 && !enviando;

  // Conserva el último mensaje para que no desaparezca de golpe mientras se pliega.
  const ultimoError = useRef<string | null>(null);
  if (error) ultimoError.current = error;

  // Crece con el texto, sin barra de scroll hasta llegar al máximo.
  useLayoutEffectSeguro(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTO_MAXIMO)}px`;
    el.style.overflowY = el.scrollHeight > ALTO_MAXIMO ? "auto" : "hidden";
  }, [valor]);

  useEffect(() => {
    if (!enfocar) return;
    const t = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      const fin = el.value.length;
      el.setSelectionRange(fin, fin);
    }, 60);
    return () => clearTimeout(t);
  }, [enfocar]);

  function enviar() {
    if (puedeEnviar) onEnviar();
  }

  function alTeclear(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar();
    } else if (e.key === "Escape" && onCancelar) {
      e.preventDefault();
      onCancelar();
    }
  }

  const etiquetaBoton = accion === "guardar" ? "Guardar cambios" : "Enviar";

  return (
    <div className="flex items-start gap-2.5">
      {!sinAvatar && (
        <div className="shrink-0" style={{ paddingTop: (ALTO_BURBUJA - tamanoAvatar) / 2 }}>
          <AvatarAlias
            alias={sesion?.alias ?? null}
            anonimo={false}
            oficial={sesion?.esCuentaOficial}
            size={tamanoAvatar}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-end gap-1 rounded-[1.375rem] border border-transparent bg-papel-alt/70 py-1 pl-4 pr-1 transition-[background-color,border-color] duration-200 focus-within:border-verde-linea focus-within:bg-blanco-papel">
          <textarea
            ref={ref}
            rows={1}
            value={valor}
            maxLength={maximo}
            onChange={(e) => onCambio(e.target.value)}
            onKeyDown={alTeclear}
            placeholder={placeholder}
            aria-label={placeholder}
            enterKeyHint={accion === "guardar" ? "done" : "send"}
            // text-base en celular: con menos de 16px el iPhone hace zoom al enfocar.
            className="block min-h-9 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-2 text-base leading-5 text-tinta placeholder:text-tinta-suave/80 focus:shadow-none focus:outline-none md:text-sm"
          />
          <button
            type="button"
            // Evita que el textarea pierda el foco al tocar el botón.
            onMouseDown={(e) => e.preventDefault()}
            onClick={enviar}
            disabled={!puedeEnviar}
            aria-label={etiquetaBoton}
            title={etiquetaBoton}
            className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 ease-suave ${
              enviando
                ? "cursor-wait"
                : puedeEnviar
                  ? "text-verde hover:bg-verde-tenue active:scale-90"
                  : "cursor-default text-tinta-suave/40"
            }`}
          >
            {enviando ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-borde border-t-verde" />
            ) : (
              <Icono nombre={accion === "guardar" ? "check" : "enviar"} className="h-[18px] w-[18px]" grosor={2} />
            )}
          </button>
        </div>

        {onCancelar && (
          <p className="mt-1 pl-4 text-[11px] text-tinta-suave">
            <span className="hidden md:inline">Presiona Esc para </span>
            <button type="button" onClick={onCancelar} className="font-semibold text-verde hover:underline">
              <span className="md:hidden">Cancelar</span>
              <span className="hidden md:inline">cancelar</span>
            </button>
          </p>
        )}

        <Colapsable abierto={Boolean(error)}>
          <p className="mt-1 pl-4 text-xs text-terracota">{ultimoError.current}</p>
        </Colapsable>
      </div>
    </div>
  );
}

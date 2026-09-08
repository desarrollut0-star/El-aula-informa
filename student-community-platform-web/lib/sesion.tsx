"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { api } from "./api-client";
import type { Sesion } from "./tipos";

type Estado = "cargando" | "invitado" | "dentro";

/** Cierre automático de sesión tras este tiempo sin interacción. */
const INACTIVIDAD_MS = 15 * 60 * 1000;
/** Marca que /acceso lee para avisar "cerramos por inactividad". */
export const CLAVE_CIERRE_INACTIVIDAD = "cierre_por_inactividad";

interface Contexto {
  estado: Estado;
  sesion: Sesion | null;
  /** true solo si la cuenta puede interactuar (publicar, comentar, votar…). */
  puedeInteractuar: boolean;
  refrescar: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const SesionCtx = createContext<Contexto | null>(null);

/**
 * Estado de sesión compartido para toda la app.
 *
 * Quién puede entrar / interactuar lo decide el BACKEND (que a su vez
 * confía en el trigger de la base). Aquí solo reflejamos:
 *  - "invitado": no hay sesión → solo ve la portada institucional
 *  - "dentro" + rol no_verificado → puede leer el muro, no interactuar
 *  - "dentro" + rol verificado → acceso completo
 *
 * Además cierra la sesión sola tras 15 min sin interacción (una sesión que
 * queda abierta un día en una compu compartida no es recomendable).
 */
export function SesionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [sesion, setSesion] = useState<Sesion | null>(null);

  const refrescar = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setSesion(null);
      setEstado("invitado");
      return;
    }
    try {
      const { session } = await api.sesion();
      setSesion(session);
      setEstado(session ? "dentro" : "invitado");
    } catch {
      setSesion(null);
      setEstado("invitado");
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setEstado("invitado");
  }, []);

  useEffect(() => {
    void refrescar();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refrescar();
    });
    return () => sub.subscription.unsubscribe();
  }, [refrescar]);

  // ---- cierre por inactividad ----
  const ultimaActividad = useRef(Date.now());
  useEffect(() => {
    if (estado !== "dentro") return;

    const marcar = () => {
      ultimaActividad.current = Date.now();
    };
    const eventos = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));

    const iv = setInterval(async () => {
      if (Date.now() - ultimaActividad.current < INACTIVIDAD_MS) return;
      clearInterval(iv);
      try {
        sessionStorage.setItem(CLAVE_CIERRE_INACTIVIDAD, String(Date.now()));
      } catch {
        /* modo incógnito */
      }
      await cerrarSesion();
      router.push("/acceso");
    }, 30_000);

    return () => {
      clearInterval(iv);
      eventos.forEach((e) => window.removeEventListener(e, marcar));
    };
  }, [estado, cerrarSesion, router]);

  return (
    <SesionCtx.Provider
      value={{
        estado,
        sesion,
        puedeInteractuar: estado === "dentro" && sesion?.rol === "verificado" && sesion.aceptoTerminos,
        refrescar,
        cerrarSesion,
      }}
    >
      {children}
    </SesionCtx.Provider>
  );
}

export function useSesion(): Contexto {
  const ctx = useContext(SesionCtx);
  if (!ctx) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return ctx;
}

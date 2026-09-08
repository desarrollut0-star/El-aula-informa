"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { api } from "./api-client";
import type { Sesion } from "./tipos";

type Estado = "cargando" | "invitado" | "dentro";

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
 */
export function SesionProvider({ children }: { children: React.ReactNode }) {
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
      // El backend no respondió; asumimos invitado para no mostrar de más.
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

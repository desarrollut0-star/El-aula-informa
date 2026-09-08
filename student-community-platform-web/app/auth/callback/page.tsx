"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const DOMINIO = process.env.NEXT_PUBLIC_INSTITUTIONAL_EMAIL_DOMAIN ?? "uthh.edu.mx";

/**
 * Vuelta de Google SSO. En cuanto supabase-js tiene la sesión (del hash o
 * ya persistida) mandamos a /completar-perfil — ahí el SesionProvider y la
 * página consultan al backend. NO bloqueamos la navegación esperando al
 * backend: eso hacía que se viera "congelado".
 *
 * El filtro de dominio lo hace el trigger de la base; si rechazó el alta,
 * Supabase devuelve el error en la URL y lo mostramos aquí.
 */
function leerError(): string | null {
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = q.get("error") ?? h.get("error");
  const desc = (q.get("error_description") ?? h.get("error_description") ?? "").toLowerCase();
  if (!code) return null;
  if (/database error saving new user|not authorized|dominio|institucional/.test(desc)) {
    return `Esa cuenta no está autorizada. Entra con tu correo institucional (@${DOMINIO}).`;
  }
  if (code === "access_denied") {
    return "Acceso cancelado o bloqueado por el administrador de tu Workspace. Si sigue, avísale a Sistemas de la UTHH.";
  }
  return "No se completó el acceso con Google. Vuelve a intentarlo.";
}

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errUrl = leerError();
    if (errUrl) {
      setError(errUrl);
      return;
    }

    let hecho = false;
    const ir = () => {
      if (hecho) return;
      hecho = true;
      router.replace("/completar-perfil");
    };

    // 1) ¿ya hay sesión? (el hash se procesa al llamar getSession)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) ir();
    });

    // 2) o en cuanto supabase-js la establezca
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) ir();
    });

    // 3) si en 5 s no llegó nada, algo falló
    const t = setTimeout(() => {
      if (!hecho) setError(leerError() ?? "No se pudo iniciar sesión. Vuelve a intentarlo.");
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-sm text-center">
      {error ? (
        <>
          <p className="text-sm text-terracota">{error}</p>
          <Link href="/acceso" className="mt-4 inline-block text-sm underline">Volver al acceso</Link>
        </>
      ) : (
        <p className="text-sm text-tinta-suave">Iniciando sesión…</p>
      )}
    </div>
  );
}

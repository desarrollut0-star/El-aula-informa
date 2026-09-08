"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api-client";

const DOMINIO = process.env.NEXT_PUBLIC_INSTITUTIONAL_EMAIL_DOMAIN ?? "uthh.edu.mx";

/**
 * Vuelta de Google SSO.
 *
 * Quién puede entrar lo decide la BASE DE DATOS (trigger fn_auth_validar_dominio:
 * @uthh.edu.mx o lista blanca privado.cuentas_autorizadas). Aquí NO filtramos por
 * dominio: si la base rechazó el alta, Supabase lo devuelve como error en la URL;
 * si el alta pasó pero el backend no reconoce la cuenta, cerramos sesión.
 *
 * La cuenta nace con alias seudónimo (alumno_xxxxxxx), NO con el nombre de
 * Google — es el modelo de anonimato del muro. Por eso vamos a /completar-perfil.
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
    return "Acceso cancelado o bloqueado por el administrador de tu Workspace. Si el problema persiste, avísale a Sistemas de la UTHH.";
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

    let cancelado = false;

    async function backendReconoceLaCuenta(): Promise<boolean> {
      for (let i = 0; i < 4 && !cancelado; i++) {
        try {
          const { session } = await api.sesion();
          if (session) return true;
        } catch {
          /* el backend puede tardar en ver el token recién emitido */
        }
        await new Promise((r) => setTimeout(r, 700));
      }
      return false;
    }

    async function resolver() {
      // Espera a que supabase-js procese los tokens del hash.
      let sesion = (await supabase.auth.getSession()).data.session;
      for (let i = 0; i < 5 && !sesion && !cancelado; i++) {
        await new Promise((r) => setTimeout(r, 500));
        sesion = (await supabase.auth.getSession()).data.session;
      }
      if (cancelado) return;
      if (!sesion) {
        setError(leerError() ?? "No se pudo iniciar sesión. Vuelve a intentarlo.");
        return;
      }
      if (await backendReconoceLaCuenta()) {
        if (!cancelado) router.replace("/completar-perfil");
        return;
      }
      await supabase.auth.signOut();
      if (!cancelado) {
        setError(`Tu cuenta no está autorizada para El Aula Informa. Entra con tu correo institucional (@${DOMINIO}).`);
      }
    }

    void resolver();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-sm text-center">
      {error ? (
        <>
          <p className="text-sm text-terracota">{error}</p>
          <Link href="/acceso" className="mt-4 inline-block text-sm underline">
            Volver al acceso
          </Link>
        </>
      ) : (
        <p className="text-sm text-tinta-suave">Iniciando sesión…</p>
      )}
    </div>
  );
}

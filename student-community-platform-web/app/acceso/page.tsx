"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Colapsable } from "@/components/ui/Colapsable";
import { supabase } from "@/lib/supabase";
import { CLAVE_CIERRE_INACTIVIDAD } from "@/lib/sesion";

const DOMINIO = process.env.NEXT_PUBLIC_INSTITUTIONAL_EMAIL_DOMAIN ?? "uthh.edu.mx";

/**
 * Quién puede entrar lo decide la BASE DE DATOS (trigger fn_auth_validar_dominio:
 * @uthh.edu.mx o lista blanca privado.cuentas_autorizadas). El frontend NO
 * filtra por dominio: tras autenticar vamos directo a /completar-perfil y ahí
 * el backend decide (si no reconoce la cuenta, cae al modo visitante).
 */

function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

const enlaceSecundario =
  "text-xs text-tinta-suave underline-offset-4 transition-colors hover:text-verde-oscuro hover:underline";

export default function Acceso() {
  const router = useRouter();
  const [modo, setModo] = useState<"google" | "codigo">("google");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porInactividad, setPorInactividad] = useState(false);

  // Conserva el último mensaje para que no desaparezca de golpe mientras se pliega.
  const ultimoError = useRef<string | null>(null);
  if (error) ultimoError.current = error;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLAVE_CIERRE_INACTIVIDAD)) {
        setPorInactividad(true);
        sessionStorage.removeItem(CLAVE_CIERRE_INACTIVIDAD);
      }
    } catch {
      /* modo incógnito */
    }
  }, []);

  async function conGoogle() {
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setCargando(false);
      setError("No se pudo abrir el acceso con Google. Intenta de nuevo.");
    }
    // si no hay error, el navegador se redirige a Google
  }

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithOtp({ email: correo });
    setCargando(false);
    if (error) {
      // El trigger de la base devuelve "Database error saving new user"
      // cuando el correo no está autorizado (ni @uthh.edu.mx ni lista blanca).
      setError(
        /database error saving new user/i.test(error.message)
          ? `Ese correo no está autorizado. Usa tu correo institucional (@${DOMINIO}).`
          : "No se pudo enviar el código. Intenta de nuevo en unos minutos.",
      );
      return;
    }
    setPaso("codigo");
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.verifyOtp({ email: correo, token: codigo, type: "email" });
    setCargando(false);
    if (error) {
      setError("Código incorrecto o vencido. Pide uno nuevo.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-2 md:py-8">
      <Colapsable abierto={porInactividad}>
        <div className="rounded-xl border border-ocre/40 bg-ocre-tenue px-4 py-3 text-sm text-ocre">
          Cerramos tu sesión por <strong>15 minutos de inactividad</strong>. Vuelve a entrar para continuar.
        </div>
      </Colapsable>

      <div className="tarjeta animate-aparecer p-6 shadow-elevada md:p-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-verde-oscuro font-display text-xl font-extrabold leading-none text-blanco-papel">
          A
        </span>
        <h1 className="mt-4 text-3xl">Accede con tu cuenta de la UTHH</h1>

        <div key={`${modo}-${paso}`} className="animate-aparecer">
          {modo === "google" ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
                Entra con tu correo institucional de Google (<strong className="text-tinta">@{DOMINIO}</strong>).
                Es un clic, sin contraseña ni códigos.
              </p>
              <div className="mt-6 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={conGoogle}
                  disabled={cargando}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-borde bg-white px-4 py-2.5 text-sm font-semibold text-tinta shadow-tarjeta transition-[box-shadow,border-color,transform] duration-200 ease-suave hover:border-verde-linea hover:shadow-elevada active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
                >
                  {cargando ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-borde border-t-verde" />
                  ) : (
                    <LogoGoogle />
                  )}
                  {cargando ? "Abriendo Google…" : "Continuar con Google"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModo("codigo");
                    setError(null);
                  }}
                  className={enlaceSecundario}
                >
                  No puedo usar Google, enviarme un código por correo
                </button>
              </div>
            </>
          ) : paso === "correo" ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
                Te enviamos un código de 8 dígitos a tu correo, sin contraseña. Solo se admite el correo
                institucional (@{DOMINIO}).
              </p>
              <form onSubmit={enviarCodigo} className="mt-6 flex flex-col gap-3">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={`tu.nombre@${DOMINIO}`}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full border border-borde bg-blanco-papel px-3 py-2.5"
                />
                <Boton type="submit" disabled={cargando}>
                  {cargando ? "Enviando…" : "Enviar código"}
                </Boton>
                <button
                  type="button"
                  onClick={() => {
                    setModo("google");
                    setError(null);
                  }}
                  className={`${enlaceSecundario} mt-1 self-center`}
                >
                  Volver a entrar con Google
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
                Escribe el código de 8 dígitos que te llegó a <strong className="text-tinta">{correo}</strong>.
              </p>
              <form onSubmit={verificar} className="mt-6 flex flex-col gap-3">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  placeholder="12345678"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="w-full border border-borde bg-blanco-papel px-3 py-3 text-center font-mono text-xl tracking-[0.4em]"
                />
                <Boton type="submit" disabled={cargando || codigo.length !== 8}>
                  {cargando ? "Verificando…" : "Entrar"}
                </Boton>
                <button
                  type="button"
                  onClick={() => setPaso("correo")}
                  className={`${enlaceSecundario} mt-1 self-center`}
                >
                  Cambiar de correo o pedir otro código
                </button>
              </form>
            </>
          )}
        </div>

        <Colapsable abierto={Boolean(error)}>
          <p className="mt-4 rounded-lg bg-terracota-tenue px-3 py-2 text-sm text-terracota">{ultimoError.current}</p>
        </Colapsable>
      </div>
    </div>
  );
}

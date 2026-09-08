"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api-client";

const DOMINIO = process.env.NEXT_PUBLIC_INSTITUTIONAL_EMAIL_DOMAIN ?? "uthh.edu.mx";

/**
 * Quién puede entrar lo decide la BASE DE DATOS (trigger fn_auth_validar_dominio:
 * @uthh.edu.mx o lista blanca privado.cuentas_autorizadas). El frontend NO
 * filtra por dominio — solo entra si el backend reconoce la cuenta.
 */
async function backendReconoceLaCuenta(): Promise<boolean> {
  for (let intento = 0; intento < 3; intento++) {
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

export default function Acceso() {
  const router = useRouter();
  const [modo, setModo] = useState<"google" | "codigo">("google");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (error) {
      setCargando(false);
      setError("Código incorrecto o vencido. Pide uno nuevo.");
      return;
    }
    if (await backendReconoceLaCuenta()) {
      router.push("/completar-perfil");
      return;
    }
    await supabase.auth.signOut();
    setCargando(false);
    setError(`Tu cuenta no está autorizada para El Aula Informa. Usa tu correo institucional (@${DOMINIO}).`);
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl">Accede con tu cuenta de la UTHH</h1>

      {modo === "google" ? (
        <>
          <p className="mt-2 text-sm text-tinta-suave">
            Entra con tu correo institucional de Google (<strong>@{DOMINIO}</strong>).
            Es un clic, sin contraseña ni códigos.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Boton type="button" onClick={conGoogle} disabled={cargando}>
              {cargando ? "Abriendo…" : "Continuar con Google"}
            </Boton>
            <button
              type="button"
              onClick={() => { setModo("codigo"); setError(null); }}
              className="text-xs text-tinta-suave underline"
            >
              No puedo usar Google — enviarme un código por correo
            </button>
          </div>
        </>
      ) : paso === "correo" ? (
        <>
          <p className="mt-2 text-sm text-tinta-suave">
            Te enviamos un código de 8 dígitos a tu correo, sin contraseña. Solo se
            admite el correo institucional (@{DOMINIO}).
          </p>
          <form onSubmit={enviarCodigo} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder={`tu.nombre@${DOMINIO}`}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="border border-borde bg-blanco-papel px-3 py-2 outline-none focus:border-verde"
            />
            <Boton type="submit" disabled={cargando}>
              {cargando ? "Enviando…" : "Enviar código"}
            </Boton>
            <button
              type="button"
              onClick={() => { setModo("google"); setError(null); }}
              className="text-xs text-tinta-suave underline"
            >
              Volver a entrar con Google
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-tinta-suave">
            Escribe el código de 8 dígitos que te llegó a <strong>{correo}</strong>.
          </p>
          <form onSubmit={verificar} className="mt-6 flex flex-col gap-3">
            <input
              inputMode="numeric"
              required
              maxLength={8}
              placeholder="12345678"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="border border-borde bg-blanco-papel px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-verde"
            />
            <Boton type="submit" disabled={cargando || codigo.length !== 8}>
              {cargando ? "Verificando…" : "Entrar"}
            </Boton>
            <button
              type="button"
              onClick={() => setPaso("correo")}
              className="text-xs text-tinta-suave underline"
            >
              Cambiar de correo o pedir otro código
            </button>
          </form>
        </>
      )}

      {error && <p className="mt-4 text-sm text-terracota">{error}</p>}
    </div>
  );
}

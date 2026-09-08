"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { Boton } from "@/components/ui/Boton";
import type { Sesion } from "@/lib/tipos";

export default function MiCuenta() {
  const [cargando, setCargando] = useState(true);
  const [session, setSession] = useState<Sesion | null>(null);
  const [version, setVersion] = useState("");

  async function recargar() {
    const r = await api.sesion().catch(() => ({ session: null, versionTerminos: "" }));
    setSession(r.session);
    setVersion(r.versionTerminos);
    setCargando(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(recargar);
  }, []);

  async function aceptar() {
    await api.aceptarTerminos(version).catch(() => {});
    await recargar();
  }

  async function salir() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (cargando) return <p className="text-tinta-suave">Cargando…</p>;

  if (!session) {
    return (
      <div>
        <h1 className="text-3xl">Mi cuenta</h1>
        <p className="mt-2 text-tinta-suave">
          No has iniciado sesión. Ve a <Link href="/acceso" className="underline">acceso</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">Mi cuenta</h1>
      <dl className="grid max-w-sm grid-cols-2 gap-y-2 text-sm">
        <dt className="text-tinta-suave">Alias</dt>
        <dd>{session.alias}</dd>
        <dt className="text-tinta-suave">Rol</dt>
        <dd>{session.rol === "verificado" ? "Verificado" : "No verificado"}</dd>
        <dt className="text-tinta-suave">Programa</dt>
        <dd>{session.programaId ? "Registrado" : "Sin registrar"}</dd>
        <dt className="text-tinta-suave">Términos</dt>
        <dd>{session.aceptoTerminos ? "Aceptados" : "Pendientes"}</dd>
      </dl>

      {!session.programaId && (
        <p className="max-w-prose text-sm text-ocre">
          Falta elegir tu programa. <Link href="/completar-perfil" className="underline">Completar perfil</Link>.
        </p>
      )}

      {!session.aceptoTerminos && (
        <div className="max-w-prose border border-dashed border-terracota bg-terracota-tenue p-4 text-sm">
          <p className="mb-2">
            Para publicar, vota, firmar o denunciar necesitas aceptar los{" "}
            <Link href="/terminos" className="underline" target="_blank">términos de uso</Link> y el{" "}
            <Link href="/privacidad" className="underline" target="_blank">aviso de privacidad</Link>.
          </p>
          <Boton onClick={aceptar}>Acepto los términos</Boton>
        </div>
      )}

      {session.rol !== "verificado" && (
        <p className="max-w-prose text-sm text-terracota">Tu cuenta está en modo solo lectura.</p>
      )}

      <div>
        <Boton variante="secundario" onClick={salir}>Cerrar sesión</Boton>
      </div>
    </div>
  );
}

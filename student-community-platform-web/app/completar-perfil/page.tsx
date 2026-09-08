"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { Boton } from "@/components/ui/Boton";
import type { Programa } from "@/lib/tipos";

/**
 * Onboarding del primer acceso: elegir programa + aceptar los términos.
 * La aceptación queda registrada en la BD (usuarios.acepto_terminos_en /
 * version_terminos). Sin aceptar, el backend no deja publicar.
 */
export default function CompletarPerfil() {
  const router = useRouter();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaId, setProgramaId] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [version, setVersion] = useState("");
  const [yaAcepto, setYaAcepto] = useState(false);
  const [yaTienePrograma, setYaTienePrograma] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.programas().then((r) => setProgramas(r.programas)).catch(() => setProgramas([]));
    api.sesion().then((r) => {
      setVersion(r.versionTerminos);
      if (r.session) {
        setYaAcepto(r.session.aceptoTerminos);
        setYaTienePrograma(Boolean(r.session.programaId));
        if (r.session.programaId) setProgramaId(r.session.programaId);
      }
    }).catch(() => {});
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (!yaTienePrograma) await api.completarPerfil(programaId);
      if (!yaAcepto) await api.aceptarTerminos(version);
      router.push("/yo");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar. ¿Iniciaste sesión?");
    }
  }

  const puedeEnviar = (yaTienePrograma || programaId) && (yaAcepto || acepta);

  return (
    <form onSubmit={enviar} className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="text-3xl">Completa tu perfil</h1>

      {!yaTienePrograma && (
        <label className="flex flex-col gap-1 text-sm">
          Programa educativo
          <select
            required
            value={programaId}
            onChange={(e) => setProgramaId(e.target.value)}
            className="border border-borde bg-blanco-papel px-3 py-2"
          >
            <option value="">Selecciona…</option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>
      )}

      {!yaAcepto && (
        <label className="flex items-start gap-2 border border-borde bg-papel-alt p-3 text-sm">
          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5" />
          <span>
            He leído y acepto los{" "}
            <Link href="/terminos" className="underline" target="_blank">términos de uso</Link>,{" "}
            el <Link href="/codigo-de-conducta" className="underline" target="_blank">código de conducta</Link> y el{" "}
            <Link href="/privacidad" className="underline" target="_blank">aviso de privacidad</Link>.
          </span>
        </label>
      )}

      {error && <p className="text-sm text-terracota">{error}</p>}
      <Boton type="submit" disabled={!puedeEnviar}>Continuar</Boton>
    </form>
  );
}

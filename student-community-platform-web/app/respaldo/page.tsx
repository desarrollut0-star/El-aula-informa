"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Boton } from "@/components/ui/Boton";
import type { Programa } from "@/lib/tipos";

/**
 * Firma de respaldo — conteo simple, sin tablero. La lista de programas y
 * el POST /firmas ya existen; falta que el alumno tenga programa asignado.
 */
export default function Respaldo() {
  const [firmado, setFirmado] = useState<boolean | null>(null);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaId, setProgramaId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.miFirma().then((r) => setFirmado(r.firmado)).catch(() => setFirmado(null));
    api.programas().then((r) => setProgramas(r.programas)).catch(() => setProgramas([]));
  }, []);

  async function firmar() {
    setError(null);
    try {
      await api.firmar(programaId);
      setFirmado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo firmar. ¿Iniciaste sesión?");
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="text-3xl">Firmar mi respaldo</h1>
      <p className="text-sm text-tinta-suave">
        Una firma por alumno. Sirve como conteo de apoyo estudiantil al pliego petitorio.
      </p>

      {firmado ? (
        <p className="text-verde-oscuro">Ya registraste tu firma. Gracias.</p>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Programa
            <select
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
          {error && <p className="text-sm text-terracota">{error}</p>}
          <Boton onClick={firmar} disabled={!programaId}>Firmar</Boton>
        </>
      )}
    </div>
  );
}

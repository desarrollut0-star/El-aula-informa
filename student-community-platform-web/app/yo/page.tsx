"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useSesion } from "@/lib/sesion";
import { PuertaSesion } from "@/components/auth/PuertaSesion";
import { AvatarAlias } from "@/components/contenido/AvatarAlias";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Icono, type NombreIcono } from "@/components/ui/Iconos";

export default function MiCuenta() {
  return (
    <PuertaSesion titulo="Mi cuenta">
      <Contenido />
    </PuertaSesion>
  );
}

function Contenido() {
  const { sesion, refrescar, cerrarSesion } = useSesion();
  const router = useRouter();
  const [programa, setPrograma] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [aceptando, setAceptando] = useState(false);
  const [errorTerminos, setErrorTerminos] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [noLeidas, setNoLeidas] = useState<number | null>(null);
  const [publicaciones, setPublicaciones] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    api.sesion().then((r) => vivo && setVersion(r.versionTerminos)).catch(() => {});
    api.notificacionesNoLeidas().then((r) => vivo && setNoLeidas(r.total)).catch(() => {});
    api.misPublicaciones().then((r) => vivo && setPublicaciones(r.publicaciones.length)).catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const programaId = sesion?.programaId ?? null;
  useEffect(() => {
    if (!programaId) {
      setPrograma(null);
      return;
    }
    let vivo = true;
    api
      .programas()
      .then((r) => vivo && setPrograma(r.programas.find((p) => p.id === programaId)?.nombre ?? null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [programaId]);

  if (!sesion) return null;

  async function aceptar() {
    setAceptando(true);
    setErrorTerminos(null);
    try {
      const v = version || (await api.sesion()).versionTerminos;
      await api.aceptarTerminos(v);
      await refrescar();
    } catch (err) {
      setErrorTerminos(err instanceof ApiError ? err.message : "No se pudo registrar. Intenta de nuevo.");
    } finally {
      setAceptando(false);
    }
  }

  async function salir() {
    setSaliendo(true);
    await cerrarSesion();
    router.push("/");
  }

  const verificada = sesion.rol === "verificado";
  const nombrePrograma = sesion.esCuentaOficial
    ? "Sociedad Estudiantil"
    : sesion.programaId
      ? (programa ?? "Cargando programa…")
      : "Programa sin registrar";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Perfil */}
      <section className="tarjeta animate-aparecer overflow-hidden">
        <div
          aria-hidden
          className="h-20 bg-verde-oscuro bg-[radial-gradient(circle_at_85%_20%,rgba(154,101,32,0.45),transparent_50%),radial-gradient(circle_at_10%_100%,rgba(169,196,170,0.2),transparent_45%)] md:h-24"
        />
        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <span className="-mt-10 inline-flex rounded-full bg-blanco-papel p-1 shadow-tarjeta">
            <AvatarAlias alias={sesion.alias} anonimo={false} oficial={sesion.esCuentaOficial} size={72} />
          </span>
          <h1 className="mt-2 break-words text-3xl">{sesion.alias}</h1>
          <p className="mt-0.5 text-sm text-tinta-suave">{nombrePrograma}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tono={verificada ? "verde" : "ocre"} icono={verificada ? "check" : "candado"}>
              {verificada ? "Cuenta verificada" : "Solo lectura"}
            </Chip>
            {sesion.esCuentaOficial && (
              <Chip tono="oscuro" icono="estrella">
                Cuenta oficial
              </Chip>
            )}
            <Chip tono={sesion.aceptoTerminos ? "neutro" : "terracota"} icono={sesion.aceptoTerminos ? "check" : "escudo"}>
              {sesion.aceptoTerminos ? "Términos aceptados" : "Términos pendientes"}
            </Chip>
          </div>
        </div>
      </section>

      {/* Pendientes */}
      {!sesion.programaId && !sesion.esCuentaOficial && (
        <Aviso
          tono="ocre"
          icono="usuario"
          titulo="Falta elegir tu programa"
          texto="Tu programa aparece junto a tu alias en lo que publicas. Solo tarda un momento."
        >
          <Link href="/completar-perfil" className={clasesBoton("primario", "shrink-0", "chico")}>
            Completar perfil
          </Link>
        </Aviso>
      )}

      {!sesion.aceptoTerminos && (
        <Aviso
          tono="terracota"
          icono="escudo"
          titulo="Acepta los términos para participar"
          texto={
            <>
              Para publicar, reaccionar, firmar o reportar necesitas aceptar los{" "}
              <Link href="/terminos" target="_blank" className="font-semibold underline underline-offset-2">
                términos de uso
              </Link>{" "}
              y el{" "}
              <Link href="/privacidad" target="_blank" className="font-semibold underline underline-offset-2">
                aviso de privacidad
              </Link>
              .
            </>
          }
          pie={errorTerminos}
        >
          <Boton tamano="chico" onClick={aceptar} disabled={aceptando} className="shrink-0">
            {aceptando ? "Registrando…" : "Acepto los términos"}
          </Boton>
        </Aviso>
      )}

      {!verificada && (
        <Aviso
          tono="neutro"
          icono="candado"
          titulo="Tu cuenta está en modo solo lectura"
          texto="Puedes leer el muro, pero no publicar ni reaccionar. Pasa cuando tu correo aún no se confirma o cuando ya no apareces como inscrito."
        />
      )}

      {/* Accesos */}
      <section className="grid animate-aparecer gap-3 [animation-delay:60ms] sm:grid-cols-2">
        <Atajo
          href="/mis-publicaciones"
          icono="lista"
          titulo="Mis publicaciones"
          texto={
            publicaciones === null
              ? "Lo que has compartido"
              : publicaciones === 1
                ? "1 publicación"
                : `${publicaciones} publicaciones`
          }
        />
        <Atajo
          href="/notificaciones"
          icono="campana"
          titulo="Notificaciones"
          texto={noLeidas === null ? "Avisos sobre tu cuenta" : noLeidas === 0 ? "Estás al día" : `${noLeidas} sin leer`}
          destacado={Boolean(noLeidas)}
        />
        <Atajo href="/respaldo" icono="pluma" titulo="Firmar respaldo" texto="Suma tu apoyo a la comunidad" />
        <Atajo href="/codigo-de-conducta" icono="usuarios" titulo="Código de conducta" texto="Cómo convivimos aquí" />
      </section>

      {/* Datos y privacidad */}
      <section className="grid animate-aparecer gap-3 [animation-delay:120ms] md:grid-cols-5">
        <div className="tarjeta p-5 md:col-span-3">
          <h2 className="text-lg">Datos de la cuenta</h2>
          <dl className="mt-2 divide-y divide-borde/60 text-sm">
            <Fila etiqueta="Alias">{sesion.alias}</Fila>
            <Fila etiqueta="Programa">{nombrePrograma}</Fila>
            <Fila etiqueta="Estado">{verificada ? "Verificada" : "Solo lectura"}</Fila>
            <Fila etiqueta="Términos">{sesion.aceptoTerminos ? "Aceptados" : "Pendientes"}</Fila>
          </dl>
        </div>

        <div className="flex flex-col rounded-xl border border-verde-linea/50 bg-verde-tenue/40 p-5 md:col-span-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-verde-tenue text-verde-oscuro">
            <Icono nombre="escudo" className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-lg">Tu identidad está protegida</h2>
          <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
            Tu alias es un seudónimo. Tu nombre real y tu correo nunca se muestran, y puedes publicar testimonios
            de forma anónima.
          </p>
          <Link
            href="/privacidad"
            className="group mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-verde transition-colors hover:text-verde-oscuro"
          >
            Aviso de privacidad
            <Icono nombre="flechaDer" className="h-4 w-4 transition-transform duration-200 ease-suave group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Sesión */}
      <section className="tarjeta flex animate-aparecer flex-col gap-3 p-5 [animation-delay:180ms] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg">Sesión</h2>
          <p className="text-sm text-tinta-suave">Por seguridad, se cierra sola tras 15 minutos sin actividad.</p>
        </div>
        <button
          type="button"
          onClick={salir}
          disabled={saliendo}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-terracota/35 px-4 py-2 text-sm font-semibold text-terracota transition-[background-color,border-color,transform] duration-200 ease-suave hover:border-terracota/60 hover:bg-terracota-tenue active:scale-[0.98] disabled:opacity-60"
        >
          <Icono nombre="salir" />
          {saliendo ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </section>
    </div>
  );
}

type Tono = "verde" | "ocre" | "terracota" | "neutro" | "oscuro";

const CHIP: Record<Tono, string> = {
  verde: "bg-verde-tenue text-verde-oscuro",
  ocre: "bg-ocre-tenue text-ocre",
  terracota: "bg-terracota-tenue text-terracota",
  neutro: "bg-papel-alt text-tinta-suave",
  oscuro: "bg-verde-oscuro text-blanco-papel",
};

function Chip({ tono, icono, children }: { tono: Tono; icono: NombreIcono; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${CHIP[tono]}`}>
      <Icono nombre={icono} className="h-3.5 w-3.5" grosor={2.2} />
      {children}
    </span>
  );
}

const AVISO: Record<"ocre" | "terracota" | "neutro", { caja: string; icono: string }> = {
  ocre: { caja: "border-ocre/35 bg-ocre-tenue/60", icono: "bg-ocre-tenue text-ocre" },
  terracota: { caja: "border-terracota/35 bg-terracota-tenue/60", icono: "bg-terracota-tenue text-terracota" },
  neutro: { caja: "border-borde bg-papel-alt/60", icono: "bg-papel-alt text-tinta-suave" },
};

function Aviso({
  tono,
  icono,
  titulo,
  texto,
  pie,
  children,
}: {
  tono: "ocre" | "terracota" | "neutro";
  icono: NombreIcono;
  titulo: string;
  texto: React.ReactNode;
  pie?: string | null;
  children?: React.ReactNode;
}) {
  const t = AVISO[tono];
  return (
    <section className={`flex animate-aparecer flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${t.caja}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.icono}`}>
        <Icono nombre={icono} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-tinta">{titulo}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-tinta-suave">{texto}</p>
        {pie && <p className="mt-1 text-xs text-terracota">{pie}</p>}
      </div>
      {children}
    </section>
  );
}

function Atajo({
  href,
  icono,
  titulo,
  texto,
  destacado = false,
}: {
  href: string;
  icono: NombreIcono;
  titulo: string;
  texto: string;
  destacado?: boolean;
}) {
  return (
    <Link
      href={href}
      className="tarjeta group flex items-center gap-3 p-4 transition-[box-shadow,border-color,transform] duration-300 ease-suave hover:-translate-y-0.5 hover:border-verde-linea hover:shadow-elevada"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-verde-tenue text-verde-oscuro transition-colors duration-300 group-hover:bg-verde group-hover:text-blanco-papel">
        <Icono nombre={icono} className="h-5 w-5" />
        {destacado && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-ocre ring-2 ring-blanco-papel" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-tinta">{titulo}</span>
        <span className={`block text-xs ${destacado ? "font-semibold text-ocre" : "text-tinta-suave"}`}>{texto}</span>
      </span>
      <Icono
        nombre="flechaDer"
        className="h-4 w-4 shrink-0 text-tinta-suave transition-[color,transform] duration-300 ease-suave group-hover:translate-x-0.5 group-hover:text-verde"
      />
    </Link>
  );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-tinta-suave">{etiqueta}</dt>
      <dd className="truncate text-right font-medium text-tinta">{children}</dd>
    </div>
  );
}

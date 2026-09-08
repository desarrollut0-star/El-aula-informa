import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Context } from "hono";
import { usuarios } from "../../modules/identidad/schema";
import type { Db } from "../db/client";
import type { AppEnv } from "../../env";
import type { Rol } from "../../modules/identidad/domain/rol";

export interface Session {
  usuarioId: string;
  alias: string;
  rol: Rol;
  programaId: string | null;
  esCuentaOficial: boolean;
  /** Aceptó los términos y el aviso de privacidad (usuarios.acepto_terminos_en). */
  aceptoTerminos: boolean;
}

// El JWKS de Supabase se cachea entre peticiones (una sola instancia por URL).
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function jwks(env: { SUPABASE_URL: string; SUPABASE_JWKS_URL?: string }) {
  const url = env.SUPABASE_JWKS_URL ?? `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  let set = jwksCache.get(url);
  if (!set) {
    set = createRemoteJWKSet(new URL(url));
    jwksCache.set(url, set);
  }
  return set;
}

/**
 * Resuelve la sesión desde el token de Supabase Auth que el frontend manda
 * en `Authorization: Bearer <access_token>`. Se verifica con el JWKS del
 * proyecto (INSTRUCCIONES Parte 2, paso 2.2); el `sub` = `usuarios.id`.
 */
export async function resolverSesion(c: Context<AppEnv>, db: Db): Promise<Session | null> {
  const encabezado = c.req.header("Authorization");
  if (!encabezado?.startsWith("Bearer ")) return null;
  const token = encabezado.slice(7);

  let usuarioId: string;
  try {
    const { payload } = await jwtVerify(token, jwks(c.env));
    if (typeof payload.sub !== "string") return null;
    usuarioId = payload.sub;
  } catch {
    return null;
  }

  const [perfil] = await db
    .select({
      id: usuarios.id,
      alias: usuarios.alias,
      rol: usuarios.rol,
      programaId: usuarios.programaId,
      esCuentaOficial: usuarios.esCuentaOficial,
      aceptoTerminosEn: usuarios.aceptoTerminosEn,
      eliminadoEn: usuarios.eliminadoEn,
    })
    .from(usuarios)
    .where(eq(usuarios.id, usuarioId))
    .limit(1);

  if (!perfil || perfil.eliminadoEn) return null;

  return {
    usuarioId: perfil.id,
    alias: perfil.alias,
    rol: perfil.rol as Rol,
    programaId: perfil.programaId,
    esCuentaOficial: perfil.esCuentaOficial,
    aceptoTerminos: perfil.aceptoTerminosEn !== null,
  };
}

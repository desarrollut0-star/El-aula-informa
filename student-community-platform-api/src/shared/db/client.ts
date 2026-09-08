import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

interface ConexionEnv {
  DATABASE_URL: string;
  /** Binding de Cloudflare Hyperdrive (si se configura). Ver wrangler.toml. */
  HYPERDRIVE?: { connectionString: string };
}

/**
 * Conexión a PostgreSQL por petición del Worker.
 *
 * - Con **Hyperdrive** (recomendado): se usa `env.HYPERDRIVE.connectionString`.
 *   Hyperdrive poolea y cachea desde la red de Cloudflare, y funciona tanto
 *   en `wrangler dev` como desplegado (el driver `postgres` sobre el pooler
 *   de Supabase se cuelga en Miniflare local por el TLS sobre sockets).
 * - Sin Hyperdrive: se usa `DATABASE_URL` (pooler de Supabase, 6543).
 *
 * `prepare: false` es obligatorio contra el pooler en modo transacción.
 */
export function createDb(env: ConexionEnv | string) {
  const url = typeof env === "string" ? env : (env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);
  const client = postgres(url, { prepare: false, max: 1 });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

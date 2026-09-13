/**
 * Bindings del Worker. Secretos con `wrangler secret put`, variables en
 * wrangler.toml. Detalle en apps/backend/db/INSTRUCCIONES.txt.
 */
export interface Bindings {
  // Secretos
  /** Pooler de Supabase, MODO TRANSACCIÓN (6543), rol app_backend.<ref>. */
  DATABASE_URL: string;
  /** "pepper" del HMAC de las matrículas. Solo aquí, nunca en la base. */
  IDENTITY_PEPPER: string;
  /** Solo si el Worker administra usuarios de Auth (baja, listar). Opcional. */
  SUPABASE_SECRET_KEY?: string;
  /** Cloudinary. */
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  /** Moderación automática con un modelo ML de Hugging Face (opcional). */
  HUGGINGFACE_API_KEY?: string;
  /** LLM propio del equipo en Python (ver moderacion-ml/), opcional. */
  MODELO_ML_URL?: string;
  /** Token compartido para que solo el Worker pueda llamar al modelo propio. */
  MODELO_ML_TOKEN?: string;

  // Variables (wrangler.toml [vars])
  SUPABASE_URL: string;
  /** URL del JWKS. Si falta, se arma con `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`. */
  SUPABASE_JWKS_URL?: string;
  FRONTEND_ORIGIN: string;
  INSTITUTIONAL_EMAIL_DOMAIN: string;
  CLOUDINARY_CLOUD_NAME?: string;

  // Recursos
  /** Cloudflare Hyperdrive (recomendado para conectar a Supabase desde Workers). */
  HYPERDRIVE?: { connectionString: string };
}

export interface Variables {
  db: import("./shared/db/client").Db;
  session: import("./shared/auth/session").Session | null;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables };

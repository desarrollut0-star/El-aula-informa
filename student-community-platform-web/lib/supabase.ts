import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador — SOLO para iniciar sesión
 * (signInWithOtp + verifyOtp). La Data API del proyecto está desactivada:
 * todos los datos se piden al Worker, nunca a Supabase directo.
 *
 * La llave es la "publishable" (formato nuevo `sb_publishable_…`), no la
 * vieja anon key en formato JWT.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  {
    auth: {
      // Google SSO (camino principal) vuelve con tokens en la URL → hay que
      // detectarlos. El OTP por código no los usa, no molesta.
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: "implicit",
    },
  },
);

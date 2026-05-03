import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cliente anon sin sesión fija; útil para `auth.getUser(jwt)`. */
export function createAnonSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("SUPABASE_URL o SUPABASE_ANON_KEY no configurados");
  }
  return createClient(url, anon);
}

export function createUserScopedClient(accessToken: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("SUPABASE_URL o SUPABASE_ANON_KEY no configurados");
  }
  return createClient(url, anon, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Solo servidor. Omite RLS: usar únicamente después de validar el JWT y solo para filas del usuario autenticado.
 */
export function tryCreateServiceRoleSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

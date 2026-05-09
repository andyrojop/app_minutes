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

/**
 * Solo servidor. Cliente con la `service_role` key; usado únicamente para `auth.admin.*`
 * (alta de usuarios desde el panel admin). Las operaciones de datos van por TypeORM.
 */
export function tryCreateServiceRoleSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

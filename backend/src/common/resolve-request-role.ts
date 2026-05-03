import type { User } from "@supabase/supabase-js";

import type { AppRole } from "./app-role";
import { APP_ROLE } from "./app-role";
import { createAnonSupabaseClient, createUserScopedClient } from "../supabase/supabase";

const VALID: AppRole[] = [APP_ROLE.ADMIN, APP_ROLE.SECRETARY];

export function normalizeStoredRole(raw: unknown): AppRole | null {
  const r = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  return VALID.includes(r as AppRole) ? (r as AppRole) : null;
}

/** Igual que el signup del frontend: `options.data` → user_metadata (y a veces app_metadata). */
export function roleFromSupabaseUser(user: User | null | undefined): AppRole | null {
  if (!user) return null;
  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const am = (user.app_metadata ?? {}) as Record<string, unknown>;
  return (
    normalizeStoredRole(md.app_role) ??
    normalizeStoredRole(md.role) ??
    normalizeStoredRole(am.app_role) ??
    normalizeStoredRole(am.role)
  );
}

/**
 * Rol efectivo para autorización: DB primero; si falta, metadatos del JWT vía `getUser`.
 * Debe coincidir con `UsersService.me`: si no hay fila/rol útil en `public.users` y el JWT no trae rol,
 * el MVP ERS asume secretaría (`metaRole ?? "secretary"` en bootstrap); sin eso, `RolesGuard` devolvía
 * 403 aunque `/users/me` ya hubiera mostrado el perfil como secretaría.
 */
export async function resolveEffectiveAppRole(
  accessToken: string,
  userId: string,
): Promise<AppRole | null> {
  const sb = createUserScopedClient(accessToken);
  const { data, error } = await sb.from("users").select("role").eq("id", userId).maybeSingle();

  let dbRolePresentButInvalid = false;
  if (!error && data?.role != null && String(data.role).trim() !== "") {
    const fromDb = normalizeStoredRole(data.role);
    if (fromDb) return fromDb;
    dbRolePresentButInvalid = true;
  }

  /** Misma validación que `SupabaseAuthGuard`: `getUser()` con cliente + header a veces falla en Node; JWT explícito es estable. */
  const anon = createAnonSupabaseClient();
  const { data: authData, error: authErr } = await anon.auth.getUser(accessToken);
  if (authErr || !authData?.user) return null;
  if (authData.user.id !== userId) return null;

  const fromJwt = roleFromSupabaseUser(authData.user);
  if (fromJwt) return fromJwt;

  if (dbRolePresentButInvalid) return null;

  return APP_ROLE.SECRETARY;
}

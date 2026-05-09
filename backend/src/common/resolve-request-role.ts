import type { User } from "@supabase/supabase-js";

import type { AppRole } from "./app-role";
import { APP_ROLE } from "./app-role";

const VALID: AppRole[] = [APP_ROLE.ADMIN, APP_ROLE.SECRETARY];

/** Normaliza un rol almacenado a uno de los valores válidos de la app. */
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

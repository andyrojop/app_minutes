import { serverApiJson } from "@/lib/api/server-api";
import { createClient } from "@/lib/supabase/server";

/** Alineado con el backend: solo `admin` y `secretary` cuentan para la UI. */
function normalizeAppRole(raw: unknown): string | null {
  const r = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  return r === "admin" || r === "secretary" ? r : null;
}

function roleFromAuthMetadata(user: { user_metadata?: unknown } | null): string | null {
  if (!user?.user_metadata || typeof user.user_metadata !== "object") return null;
  const md = user.user_metadata as Record<string, unknown>;
  return normalizeAppRole(md.app_role ?? md.role);
}

/** Rol desde el API (persistido), tabla users o metadatos del JWT hasta que exista fila/columna. */
export async function getMyRole(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  try {
    const me = await serverApiJson<{ role?: string } | null>("/users/me");
    if (me?.role != null && String(me.role).trim() !== "") {
      const n = normalizeAppRole(me.role);
      if (n) return n;
    }
  } catch {
    /* fallback Supabase / metadata */
  }

  const { data, error } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (!error && data) {
    const r = (data as { role?: string }).role;
    const n = normalizeAppRole(r);
    if (n) return n;
  }

  return roleFromAuthMetadata(user);
}

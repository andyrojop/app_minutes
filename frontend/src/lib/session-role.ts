import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { getSession } from "@/lib/auth/get-session";

/** Alineado con el backend: solo `admin` y `secretary` cuentan para la UI. */
function normalizeAppRole(raw: unknown): string | null {
  const r = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  return r === "admin" || r === "secretary" ? r : null;
}

/** Rol desde la sesión NextAuth (set en el callback jwt); fallback a /users/me. */
export async function getMyRole(): Promise<string | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const fromSession = normalizeAppRole(session.user.role);
  if (fromSession) return fromSession;

  try {
    const api = await getServerApiClient();
    const me = (await api.users.usersControllerMe()) as { role?: string } | null;
    return normalizeAppRole(me?.role);
  } catch {
    return null;
  }
}

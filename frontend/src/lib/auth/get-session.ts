import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { nextAuthOptions } from "./auth.config";

/**
 * Wrapper resiliente. Si la cookie next-auth quedó firmada con un secret
 * antiguo (cambio de NEXTAUTH_SECRET), `getServerSession` lanza
 * `JWT_SESSION_ERROR: decryption operation failed`. En ese caso lo tratamos
 * como "no hay sesión" para que el layout pueda redirigir a /login.
 */
export async function getSession(): Promise<Session | null> {
  try {
    return await getServerSession(nextAuthOptions);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/decryption|jwt|jwe|invalid/i.test(msg)) {
      return null;
    }
    throw e;
  }
}

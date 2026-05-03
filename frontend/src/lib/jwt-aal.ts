/** Decodifica payload JWT (sin verificar firma; el token ya viene de Supabase). */

export function jwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64url = parts[1];
    let json: string;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(b64url, "base64url").toString("utf8");
    } else {
      const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
      json = atob(b64 + pad);
    }
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function jwtAalLevel(token: string | undefined | null): string | null {
  if (!token) return null;
  const aal = jwtPayload(token)?.aal;
  return typeof aal === "string" ? aal : null;
}

/** Supabase marca sesión con MFA verificado como `aal2`. */
export function isJwtAal2(token: string | undefined | null): boolean {
  return jwtAalLevel(token) === "aal2";
}

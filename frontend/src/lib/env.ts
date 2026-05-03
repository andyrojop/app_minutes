/**
 * Solo con valor exacto `true`: el layout protegido exige sesión MFA (claim JWT `aal2`) para administradores.
 * Sin variable o `false`: los admins entran con usuario/contraseña (útil hasta configurar TOTP en Supabase).
 */
export function adminRequiresAal2(): boolean {
  return process.env.ADMIN_REQUIRE_AAL2?.trim() === "true";
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

/** Prefer anon key; publishable keys can be set here per Supabase dashboard naming. */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return key ?? "";
}

/** `true` solo con `NEXT_PUBLIC_INVITE_ONLY=true`: bloquea `/register` y oculta el enlace en login. */
export function isInviteOnlyMode(): boolean {
  return process.env.NEXT_PUBLIC_INVITE_ONLY?.trim() === "true";
}

/** Puerto COM numérico para SigWeb (p. ej. 9 → COM9). Por defecto 9. */
export function getTopazComPortNumber(): number {
  const raw = process.env.NEXT_PUBLIC_TOPAZ_COM_PORT?.trim();
  if (!raw) return 9;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 256 ? Math.floor(n) : 9;
}

/** Si está definido (p. ej. `COM3`), se usa `SetTabletComPortByName` en lugar del número. */
export function getTopazComPortName(): string | null {
  const name = process.env.NEXT_PUBLIC_TOPAZ_COM_NAME?.trim();
  return name && name.length > 0 ? name : null;
}

/** URL absoluta del script SigWeb en el navegador (evita rutas relativas ambiguas). Solo en cliente. */
export function resolveTopazSigWebScriptUrlForBrowser(relativeOrAbsolute: string): string {
  const t = relativeOrAbsolute.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (typeof window === "undefined") return t;
  try {
    return new URL(t, window.location.origin).href;
  } catch {
    return t;
  }
}

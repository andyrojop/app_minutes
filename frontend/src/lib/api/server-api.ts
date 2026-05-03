import { createClient } from "@/lib/supabase/server";

/** Mensaje cuando fetch al API falla (backend apagado, URL incorrecta, red). */
export const API_CONNECTION_FAILED_MESSAGE =
  "No hay conexión con el servidor. Comprueba que la aplicación esté disponible e intenta otra vez.";

function apiBaseUrl(): string {
  return (
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:3001"
  );
}

function isLikelyNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const msg =
    typeof (error as { cause?: { message?: string } })?.cause?.message === "string"
      ? (error as { cause: { message: string } }).cause.message
      : "";
  if (/ECONNREFUSED|ENOTFOUND|fetch failed/i.test(String(error))) return true;
  if (/ECONNREFUSED|ENOTFOUND|fetch failed/i.test(msg)) return true;
  return false;
}

/** Segundos hasta exp del access JWT (≤0 = caducado o no decodificable). */
function jwtTtlSeconds(accessToken: string): number {
  try {
    const p = accessToken.split(".")[1];
    if (!p) return 0;
    const json = Buffer.from(p, "base64url").toString("utf8");
    const { exp } = JSON.parse(json) as { exp?: number };
    if (typeof exp !== "number") return 0;
    return exp - Math.floor(Date.now() / 1000);
  } catch {
    return 0;
  }
}

async function readHttpErrorDetail(res: Response): Promise<string> {
  let detail = res.statusText;
  try {
    const body = await res.clone().json();
    if (typeof body?.message === "string") detail = body.message;
    else if (Array.isArray(body?.message)) detail = body.message.join(", ");
    else if (body?.message && typeof body.message === "object") {
      detail = JSON.stringify(body.message);
    }
  } catch {
    try {
      detail = await res.clone().text();
    } catch {
      /* ignore */
    }
  }
  return detail || `HTTP ${res.status}`;
}

function looksLikeInvalidSupabaseBearer(detail: string): boolean {
  const d = detail.toLowerCase();
  return (
    /token inválido|invalid.*token|jwt|expir|expired|sesión|session/i.test(detail) &&
    !/mfa|aal2|dos pasos|two-?step/i.test(d)
  );
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Valida sesión con Auth y obtiene un Bearer reciente para el API Nest (misma instancia Supabase que el backend).
 * En Server Actions `getUser()` a veces falla (red, cookies aún no alineadas); se reintenta con `refreshSession()`
 * y, en último caso, un JWT de `getSession()` con exp válida (el API vuelve a validar el Bearer).
 */
async function resolveAccessTokenForBackend(supabase: ServerSupabase): Promise<string> {
  let {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const { data: ref, error: refErr } = await supabase.auth.refreshSession();
    if (!refErr) {
      ({
        data: { user },
        error: userError,
      } = await supabase.auth.getUser());
    }
    const fromRefresh = ref?.session?.access_token;
    if ((userError || !user) && fromRefresh && jwtTtlSeconds(fromRefresh) > 30) {
      return fromRefresh;
    }
  }

  if (userError || !user) {
    const { data: sess } = await supabase.auth.getSession();
    const fallback = sess.session?.access_token;
    if (fallback && jwtTtlSeconds(fallback) > 30) {
      return fallback;
    }
    const hint = String(userError?.message ?? "").toLowerCase();
    throw new Error(
      /fetch|network|econn|timeout|failed to reach/i.test(hint)
        ? "No se pudo validar la sesión con Supabase (red). Recarga la página e intenta otra vez."
        : "Sesión no válida o expirada. Cierra sesión y vuelve a entrar, o recarga la página.",
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  let token = sessionData.session?.access_token ?? null;

  const ttl = token ? jwtTtlSeconds(token) : 0;
  if (!token || ttl < 180) {
    const { data: ref, error: refErr } = await supabase.auth.refreshSession();
    if (!refErr && ref.session?.access_token) {
      token = ref.session.access_token;
    }
  }

  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
  }

  if (jwtTtlSeconds(token) <= 0) {
    throw new Error("Sesión expirada. Inicia sesión de nuevo.");
  }

  return token;
}

export async function serverApi(path: string, init?: RequestInit): Promise<Response> {
  const supabase = await createClient();
  const token = await resolveAccessTokenForBackend(supabase);

  const url = `${apiBaseUrl()}/api${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);

  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Authorization", `Bearer ${token}`);

  const doFetch = (bearer: string) => {
    const h = new Headers(headers);
    h.set("Authorization", `Bearer ${bearer}`);
    return fetch(url, { ...init, headers: h, cache: "no-store" });
  };

  let res: Response;
  try {
    res = await doFetch(token);
  } catch (error: unknown) {
    if (isLikelyNetworkFailure(error)) {
      throw new Error(API_CONNECTION_FAILED_MESSAGE);
    }
    throw error;
  }

  if (res.status === 401) {
    const detail = await readHttpErrorDetail(res);
    if (looksLikeInvalidSupabaseBearer(detail)) {
      const { data: ref } = await supabase.auth.refreshSession();
      const t2 = ref.session?.access_token;
      if (t2 && jwtTtlSeconds(t2) > 0) {
        try {
          res = await doFetch(t2);
        } catch (error: unknown) {
          if (isLikelyNetworkFailure(error)) {
            throw new Error(API_CONNECTION_FAILED_MESSAGE);
          }
          throw error;
        }
      }
    }
  }

  if (!res.ok) {
    const detail = await readHttpErrorDetail(res);
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res;
}

export async function serverApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await serverApi(path, init);
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("La respuesta del servidor no es válida.");
  }
}

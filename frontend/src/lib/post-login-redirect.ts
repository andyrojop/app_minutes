/** Primer segmento de ruta permitido tras login (evita ?next=/api/… o rutas inexistentes → 404). */
const ALLOWED_ROOTS = new Set([
  "dashboard",
  "meetings",
  "minutes",
  "commitments",
  "my-commitments",
  "reports",
  "users",
  "audit",
  "settings",
  "account",
]);

/**
 * Devuelve una ruta interna segura para `router.push` tras login.
 * Rechaza URLs absolutas, `//`, `/api/*`, `_next`, y segmentos desconocidos.
 */
export function resolveSafePostLoginRedirect(rawNext: string | null | undefined): string {
  if (rawNext == null || typeof rawNext !== "string") return "/dashboard";
  let path = rawNext.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h >= 0) path = path.slice(0, h);
  if (path === "/") return "/dashboard";
  if (path.startsWith("/api") || path.startsWith("/_next")) return "/dashboard";
  const slash2 = path.indexOf("/", 1);
  const first = slash2 === -1 ? path.slice(1) : path.slice(1, slash2);
  if (!first || !ALLOWED_ROOTS.has(first)) return "/dashboard";
  return path;
}

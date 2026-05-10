import { ApiError } from "@/lib/api/generated/core/ApiError";

export const API_CONNECTION_FAILED_MESSAGE =
  "No hay conexión con el servidor. Comprueba que la aplicación esté disponible e intenta otra vez.";

function isLikelyNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const cause =
    typeof (error as { cause?: { message?: string } })?.cause?.message === "string"
      ? (error as { cause: { message: string } }).cause.message
      : "";
  if (/ECONNREFUSED|ENOTFOUND|fetch failed/i.test(String(error))) return true;
  if (/ECONNREFUSED|ENOTFOUND|fetch failed/i.test(cause)) return true;
  return false;
}

/** Convierte ApiError u otro error en mensaje legible (sin lanzar). */
export function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body;
    if (body && typeof body === "object" && "message" in body) {
      const msg = (body as { message: unknown }).message;
      if (Array.isArray(msg)) return msg.join(", ");
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    return error.message || `HTTP ${error.status}`;
  }
  if (isLikelyNetworkFailure(error)) return API_CONNECTION_FAILED_MESSAGE;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}

/** Lanza con mensaje mapeado: úsalo en server actions para que Next muestre el detalle al cliente. */
export function rethrowApiError(error: unknown): never {
  throw new Error(mapApiError(error));
}

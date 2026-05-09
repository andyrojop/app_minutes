import type { Session } from "next-auth";

import { ApiClient } from "@/lib/api/generated/ApiClient";

export function getApiClient(
  session?: Session | null,
  baseUrl?: string,
  additionalHeaders?: Record<string, string>,
) {
  const token = session?.accessToken;
  const base =
    baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "http://localhost:8000";
  return new ApiClient({
    BASE: base,
    HEADERS: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...additionalHeaders,
    },
  });
}

import { getSession } from "@/lib/auth/get-session";
import { getApiClient } from "@/lib/api/get-api-client";

export async function getServerApiClient(additionalHeaders?: Record<string, string>) {
  const session = await getSession();
  return getApiClient(session, undefined, additionalHeaders);
}

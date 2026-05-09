"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { getApiClient } from "@/lib/api/get-api-client";

export function useApiClient(additionalHeaders?: Record<string, string>) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  return useMemo(
    () => getApiClient(session, undefined, additionalHeaders),
    // depende del token y headers adicionales; la session completa cambia con cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, JSON.stringify(additionalHeaders ?? {})],
  );
}

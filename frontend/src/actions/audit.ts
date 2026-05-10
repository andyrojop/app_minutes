"use server";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError } from "@/lib/api/errors";
import type { AuditRow } from "@/types/database";

export async function listAuditLog(): Promise<AuditRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.auditLog.auditLogControllerList();
    return Array.isArray(data) ? (data as AuditRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

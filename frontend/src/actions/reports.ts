"use server";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError } from "@/lib/api/errors";
import type { ReportsDashboard } from "@/types/database";

export async function getReportsDashboard(): Promise<ReportsDashboard> {
  try {
    const api = await getServerApiClient();
    return (await api.reports.reportsControllerDashboard()) as ReportsDashboard;
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

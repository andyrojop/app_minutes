"use server";

import { revalidatePath } from "next/cache";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError, rethrowApiError } from "@/lib/api/errors";
import type { SignatureRow } from "@/types/database";

export async function listSignaturesByMinute(minuteId: string): Promise<SignatureRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.signatures.signaturesControllerListByMinute(minuteId);
    return Array.isArray(data) ? (data as SignatureRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function registerSignatureAction(formData: FormData) {
  const minute_id = String(formData.get("minute_id") ?? "").trim();
  if (!minute_id) throw new Error("Minuta inválida.");
  const signature_svg =
    String(formData.get("signature_svg") ?? "").trim() ||
    "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";
  try {
    const api = await getServerApiClient();
    await api.signatures.signaturesControllerCreate({
      minute_id,
      signature_svg,
    } as unknown as Parameters<typeof api.signatures.signaturesControllerCreate>[0]);
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath(`/minutes/${minute_id}`);
}

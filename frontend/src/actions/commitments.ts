"use server";

import { revalidatePath } from "next/cache";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError, rethrowApiError } from "@/lib/api/errors";
import type { CommitmentRow } from "@/types/database";

export async function listCommitments(minuteId?: string): Promise<CommitmentRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.commitments.commitmentsControllerList(
      minuteId as unknown as string,
    );
    return Array.isArray(data) ? (data as CommitmentRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function listMyCommitments(): Promise<CommitmentRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.commitments.commitmentsControllerListMine();
    return Array.isArray(data) ? (data as CommitmentRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function createCommitmentAction(formData: FormData) {
  const minute_id = String(formData.get("minute_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignee_id = String(formData.get("assignee_id") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "media").trim();

  if (!minute_id || !description || !assignee_id) throw new Error("Completa los campos obligatorios.");

  try {
    const api = await getServerApiClient();
    await api.commitments.commitmentsControllerCreate({
      minute_id,
      description,
      assignee_id,
      due_date,
      priority,
    } as Parameters<typeof api.commitments.commitmentsControllerCreate>[0]);
  } catch (e) {
    rethrowApiError(e);
  }

  revalidatePath(`/minutes/${minute_id}`);
}

export async function patchCommitmentAction(formData: FormData) {
  const id = String(formData.get("commitment_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) throw new Error("Datos incompletos.");
  try {
    const api = await getServerApiClient();
    await api.commitments.commitmentsControllerPatch(
      id,
      { status } as Parameters<typeof api.commitments.commitmentsControllerPatch>[1],
    );
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath("/commitments");
  revalidatePath("/my-commitments");
}

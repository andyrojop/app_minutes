"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError, rethrowApiError } from "@/lib/api/errors";
import type { MinuteRow } from "@/types/database";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getMinute(id: string): Promise<MinuteRow> {
  try {
    const api = await getServerApiClient();
    return (await api.minutes.minutesControllerGetOne(id)) as MinuteRow;
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function listMinutesByMeeting(meetingId: string): Promise<MinuteRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.minutes.minutesControllerListByMeeting(meetingId);
    return Array.isArray(data) ? (data as MinuteRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function createMinuteAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId || !UUID_RE.test(meetingId)) throw new Error("Reunión inválida");

  let id = "";
  try {
    const api = await getServerApiClient();
    const created = await api.minutes.minutesControllerCreate({ meeting_id: meetingId });
    id = typeof created?.id === "string" ? created.id.trim() : "";
  } catch (e) {
    rethrowApiError(e);
  }

  if (!id || !UUID_RE.test(id)) {
    throw new Error("El servidor no devolvió un id de minuta válido.");
  }

  revalidatePath(`/meetings/${meetingId}`);
  redirect(`/minutes/${id}`);
}

export async function updateMinuteDraftAction(formData: FormData) {
  const minuteId = String(formData.get("minute_id") ?? "").trim();
  if (!minuteId) throw new Error("Minuta inválida");

  const body = {
    agenda: String(formData.get("agenda") ?? ""),
    desarrollo: String(formData.get("desarrollo") ?? ""),
    acuerdos: String(formData.get("acuerdos") ?? ""),
    observaciones: String(formData.get("observaciones") ?? ""),
  };

  try {
    const api = await getServerApiClient();
    await api.minutes.minutesControllerUpdateDraft(minuteId, body);
  } catch (e) {
    rethrowApiError(e);
  }

  revalidatePath(`/minutes/${minuteId}`);
}

export async function startMinuteSigningAction(formData: FormData) {
  const minuteId = String(formData.get("minute_id") ?? "").trim();
  if (!minuteId) throw new Error("Minuta inválida");
  try {
    const api = await getServerApiClient();
    await api.minutes.minutesControllerStartSigning(minuteId);
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath(`/minutes/${minuteId}`);
  redirect(`/minutes/${minuteId}?firma=iniciada`);
}

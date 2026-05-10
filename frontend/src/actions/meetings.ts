"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError, rethrowApiError } from "@/lib/api/errors";
import type { MeetingRow } from "@/types/database";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AttendeeRow = {
  meeting_id: string;
  user_id: string;
  role: string | null;
  attended: boolean | null;
};

export async function listMeetings(): Promise<MeetingRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.meetings.meetingsControllerList();
    return Array.isArray(data) ? (data as MeetingRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function getMeeting(id: string): Promise<MeetingRow> {
  try {
    const api = await getServerApiClient();
    return (await api.meetings.meetingsControllerGetOne(id)) as MeetingRow;
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function listMeetingAttendees(meetingId: string): Promise<AttendeeRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.meetings.meetingsControllerAttendees(meetingId);
    return Array.isArray(data) ? (data as AttendeeRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

export async function createMeetingAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const agenda = String(formData.get("agenda") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const scheduledRaw = String(formData.get("scheduled_at") ?? "").trim();
  const scheduled_at = scheduledRaw ? scheduledRaw : null;

  if (!title) throw new Error("El título es obligatorio");

  let id = "";
  try {
    const api = await getServerApiClient();
    const created = await api.meetings.meetingsControllerCreate({
      title,
      agenda,
      location,
      scheduled_at,
    } as Parameters<typeof api.meetings.meetingsControllerCreate>[0]);
    id = typeof created?.id === "string" ? created.id.trim() : "";
  } catch (e) {
    rethrowApiError(e);
  }

  if (!id || !UUID_RE.test(id)) {
    throw new Error("El servidor no devolvió un id de reunión válido. Revisa la consola del backend.");
  }

  revalidatePath("/meetings");
  redirect(`/meetings/${id}`);
}

export async function updateMeetingAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId) throw new Error("Reunión inválida");
  const title = String(formData.get("title") ?? "").trim();
  const agenda = String(formData.get("agenda") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const scheduledRaw = String(formData.get("scheduled_at") ?? "").trim();
  const scheduled_at = scheduledRaw ? scheduledRaw : null;
  const status = String(formData.get("status") ?? "").trim() || undefined;

  const body: Record<string, unknown> = { title, agenda, location, scheduled_at };
  if (status) body.status = status;

  try {
    const api = await getServerApiClient();
    await api.meetings.meetingsControllerUpdate(
      meetingId,
      body as Parameters<typeof api.meetings.meetingsControllerUpdate>[1],
    );
  } catch (e) {
    rethrowApiError(e);
  }

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath(`/meetings/${meetingId}/edit`);
  revalidatePath("/meetings");
}

export async function cancelMeetingAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId) throw new Error("Reunión inválida");
  try {
    const api = await getServerApiClient();
    await api.meetings.meetingsControllerUpdate(
      meetingId,
      { status: "CANCELLED" } as Parameters<typeof api.meetings.meetingsControllerUpdate>[1],
    );
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
  redirect(`/meetings/${meetingId}?cancelada=1`);
}

export async function deleteMeetingAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId) throw new Error("Reunión inválida");
  try {
    const api = await getServerApiClient();
    await api.meetings.meetingsControllerRemove(meetingId);
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function addMeetingAttendeeAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  const user_id = String(formData.get("user_id") ?? "").trim();
  if (!meetingId || !user_id) throw new Error("Datos incompletos.");
  try {
    const api = await getServerApiClient();
    await api.meetings.meetingsControllerAddAttendee(meetingId, { user_id });
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath(`/meetings/${meetingId}`);
}

export async function removeMeetingAttendeeAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!meetingId || !userId) throw new Error("Datos incompletos.");
  try {
    const api = await getServerApiClient();
    await api.meetings.meetingsControllerRemoveAttendee(meetingId, userId);
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath(`/meetings/${meetingId}`);
}

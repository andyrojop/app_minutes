"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { serverApi, serverApiJson } from "@/lib/api/server-api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createMeetingAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const agenda = String(formData.get("agenda") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const scheduledRaw = String(formData.get("scheduled_at") ?? "").trim();
  const scheduled_at = scheduledRaw ? scheduledRaw : null;

  if (!title) throw new Error("El título es obligatorio");

  const created = await serverApiJson<{ id?: string }>("/meetings", {
    method: "POST",
    body: JSON.stringify({ title, agenda, location, scheduled_at }),
  });

  const id = typeof created?.id === "string" ? created.id.trim() : "";
  if (!id || !UUID_RE.test(id)) {
    throw new Error("El servidor no devolvió un id de reunión válido. Revisa la consola del backend.");
  }

  revalidatePath("/meetings");
  redirect(`/meetings/${id}`);
}

export async function createMinuteAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId || !UUID_RE.test(meetingId)) throw new Error("Reunión inválida");

  const created = await serverApiJson<{ id?: string }>("/minutes", {
    method: "POST",
    body: JSON.stringify({ meeting_id: meetingId }),
  });

  const id = typeof created?.id === "string" ? created.id.trim() : "";
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

  await serverApi(`/minutes/${minuteId}/draft`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  revalidatePath(`/minutes/${minuteId}`);
}

export async function startMinuteSigningAction(formData: FormData) {
  const minuteId = String(formData.get("minute_id") ?? "").trim();
  if (!minuteId) throw new Error("Minuta inválida");
  await serverApi(`/minutes/${minuteId}/start-signing`, { method: "POST" });
  revalidatePath(`/minutes/${minuteId}`);
  redirect(`/minutes/${minuteId}?firma=iniciada`);
}

export async function createCommitmentAction(formData: FormData) {
  const minute_id = String(formData.get("minute_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignee_id = String(formData.get("assignee_id") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "media").trim();

  if (!minute_id || !description || !assignee_id) throw new Error("Completa los campos obligatorios.");

  await serverApiJson<{ id: string }>("/commitments", {
    method: "POST",
    body: JSON.stringify({
      minute_id,
      description,
      assignee_id,
      due_date,
      priority,
    }),
  });

  revalidatePath(`/minutes/${minute_id}`);
}

export async function patchCommitmentAction(formData: FormData) {
  const id = String(formData.get("commitment_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) throw new Error("Datos incompletos.");
  await serverApi(`/commitments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/commitments");
  revalidatePath("/my-commitments");
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

  await serverApi(`/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath(`/meetings/${meetingId}/edit`);
  revalidatePath("/meetings");
}

export async function cancelMeetingAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId) throw new Error("Reunión inválida");
  await serverApi(`/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
  redirect(`/meetings/${meetingId}?cancelada=1`);
}

export async function deleteMeetingAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  if (!meetingId) throw new Error("Reunión inválida");
  await serverApi(`/meetings/${meetingId}`, { method: "DELETE" });
  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function addMeetingAttendeeAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  const user_id = String(formData.get("user_id") ?? "").trim();
  if (!meetingId || !user_id) throw new Error("Datos incompletos.");
  await serverApi(`/meetings/${meetingId}/attendees`, {
    method: "POST",
    body: JSON.stringify({ user_id }),
  });
  revalidatePath(`/meetings/${meetingId}`);
}

export async function removeMeetingAttendeeAction(formData: FormData) {
  const meetingId = String(formData.get("meeting_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!meetingId || !userId) throw new Error("Datos incompletos.");
  await serverApi(`/meetings/${meetingId}/attendees/${userId}`, { method: "DELETE" });
  revalidatePath(`/meetings/${meetingId}`);
}

export async function inviteUserAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();
  if (!email) throw new Error("El correo es obligatorio.");
  if (role !== "admin" && role !== "secretary") throw new Error("Rol inválido.");

  await serverApiJson<{ id: string }>("/users", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });

  revalidatePath("/users");
  redirect("/users?invited=1");
}

export async function updateUserRoleAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!userId || !role) throw new Error("Datos incompletos.");
  await serverApi(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  revalidatePath("/users");
}

/** Registro de firma (trazo real vía agente local en fase posterior). */
export async function registerSignatureAction(formData: FormData) {
  const minute_id = String(formData.get("minute_id") ?? "").trim();
  if (!minute_id) throw new Error("Minuta inválida.");
  const svg = String(formData.get("signature_svg") ?? "").trim() || "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";
  await serverApiJson("/signatures", {
    method: "POST",
    body: JSON.stringify({ minute_id, signature_svg: svg }),
  });
  revalidatePath(`/minutes/${minute_id}`);
}

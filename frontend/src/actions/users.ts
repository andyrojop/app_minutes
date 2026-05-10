"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerApiClient } from "@/lib/api/get-server-api-client";
import { mapApiError, rethrowApiError } from "@/lib/api/errors";
import { InviteUserDto } from "@/lib/api/generated/models/InviteUserDto";
import { PatchUserRoleDto } from "@/lib/api/generated/models/PatchUserRoleDto";
import type { UserRow } from "@/types/database";

type ProfileRow = { role?: string; email?: string | null };

export async function getMyProfile(): Promise<ProfileRow | null> {
  try {
    const api = await getServerApiClient();
    return (await api.users.usersControllerMe()) as ProfileRow;
  } catch {
    return null;
  }
}

export async function listUsers(): Promise<UserRow[]> {
  try {
    const api = await getServerApiClient();
    const data = await api.users.usersControllerList();
    return Array.isArray(data) ? (data as UserRow[]) : [];
  } catch (e) {
    throw new Error(mapApiError(e));
  }
}

function asInviteRole(value: string): InviteUserDto.role {
  if (value === "admin") return InviteUserDto.role.ADMIN;
  if (value === "secretary") return InviteUserDto.role.SECRETARY;
  throw new Error("Rol inválido.");
}

function asPatchRole(value: string): PatchUserRoleDto.role {
  if (value === "admin") return PatchUserRoleDto.role.ADMIN;
  if (value === "secretary") return PatchUserRoleDto.role.SECRETARY;
  throw new Error("Rol inválido.");
}

export async function inviteUserAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "").trim();
  if (!email) throw new Error("El correo es obligatorio.");
  const role = asInviteRole(roleRaw);

  try {
    const api = await getServerApiClient();
    await api.users.usersControllerInvite({ email, password, role });
  } catch (e) {
    rethrowApiError(e);
  }

  revalidatePath("/users");
  redirect("/users?invited=1");
}

export async function updateUserRoleAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim();
  if (!userId || !roleRaw) throw new Error("Datos incompletos.");
  const role = asPatchRole(roleRaw);
  try {
    const api = await getServerApiClient();
    await api.users.usersControllerPatch(userId, { role });
  } catch (e) {
    rethrowApiError(e);
  }
  revalidatePath("/users");
}

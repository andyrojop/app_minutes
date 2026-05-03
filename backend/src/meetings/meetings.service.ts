import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { AddAttendeeDto } from "./dto/add-attendee.dto";
import type { CreateMeetingDto } from "./dto/create-meeting.dto";
import type { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { AuditService } from "../audit/audit.service";
import { APP_ROLE } from "../common/app-role";
import { resolveEffectiveAppRole } from "../common/resolve-request-role";
import {
  createUserScopedClient,
  tryCreateServiceRoleSupabaseClient,
} from "../supabase/supabase";
import { throwIfSupabaseError } from "../supabase/throw-if-supabase-error";
import { UsersService } from "../users/users.service";

@Injectable()
export class MeetingsService {
  constructor(
    private readonly audit: AuditService,
    private readonly users: UsersService,
  ) {}

  async list(accessToken: string) {
    const userSb = createUserScopedClient(accessToken);
    const {
      data: { user },
    } = await userSb.auth.getUser();
    const uid = user?.id;
    if (!uid) return [];

    const svc = tryCreateServiceRoleSupabaseClient();
    const role = await resolveEffectiveAppRole(accessToken, uid);

    /** Con service role evitamos listas vacías cuando RLS oculta filas al JWT (misma causa que create/get). */
    if (svc) {
      if (role === APP_ROLE.ADMIN) {
        const { data, error } = await svc
          .from("meetings")
          .select("*")
          .order("scheduled_at", { ascending: true, nullsFirst: false });
        throwIfSupabaseError(error);
        return data ?? [];
      }

      const byOrg = await svc
        .from("meetings")
        .select("*")
        .eq("organizer_id", uid);

      const attRes = await svc.from("meeting_attendees").select("meeting_id").eq("user_id", uid);
      const attendeeMeetingIds = [
        ...new Set((attRes.data ?? []).map((r: { meeting_id: string }) => r.meeting_id)),
      ];

      let viaAtt: Record<string, unknown>[] = [];
      if (attendeeMeetingIds.length > 0) {
        const attMeetings = await svc.from("meetings").select("*").in("id", attendeeMeetingIds);
        viaAtt = attMeetings.data ?? [];
      }

      const merged = new Map<string, Record<string, unknown>>();
      for (const r of [...(byOrg.data ?? []), ...viaAtt]) {
        const id = r.id as string;
        if (id) merged.set(id, r);
      }

      return Array.from(merged.values()).sort((a, b) => {
        const ta = a.scheduled_at ? new Date(String(a.scheduled_at)).getTime() : 0;
        const tb = b.scheduled_at ? new Date(String(b.scheduled_at)).getTime() : 0;
        return ta - tb;
      });
    }

    const { data, error } = await userSb
      .from("meetings")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    throwIfSupabaseError(error);
    return data ?? [];
  }

  async getById(accessToken: string, id: string) {
    const userSb = createUserScopedClient(accessToken);
    let { data, error } = await userSb.from("meetings").select("*").eq("id", id).maybeSingle();
    throwIfSupabaseError(error);

    /** Si el INSERT se hizo con service role, RLS puede ocultar la fila al cliente JWT aunque seas organizador. */
    if (!data) {
      const { data: authData } = await userSb.auth.getUser();
      const uid = authData?.user?.id;
      const svc = tryCreateServiceRoleSupabaseClient();
      if (svc && uid) {
        const role = await resolveEffectiveAppRole(accessToken, uid);
        const r = await svc.from("meetings").select("*").eq("id", id).maybeSingle();
        if (!r.error && r.data) {
          if (role === APP_ROLE.ADMIN) {
            data = r.data;
          } else {
            const row = r.data as { organizer_id: string };
            const isOrganizer = row.organizer_id === uid;
            let isAttendee = false;
            if (!isOrganizer) {
              const ma = await svc
                .from("meeting_attendees")
                .select("meeting_id")
                .eq("meeting_id", id)
                .eq("user_id", uid)
                .maybeSingle();
              isAttendee = !!ma.data;
            }
            if (isOrganizer || isAttendee) data = r.data;
          }
        }
      }
    }

    if (!data) throw new NotFoundException("Reunión no encontrada");
    return data;
  }

  async create(accessToken: string, userId: string, dto: CreateMeetingDto) {
    await this.users.me(accessToken, userId);

    const supabase = createUserScopedClient(accessToken);
    let scheduled_at: string | null = null;
    const raw = dto.scheduled_at?.trim();
    if (raw) {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException("scheduled_at no es una fecha válida");
      }
      scheduled_at = d.toISOString();
    }

    const insertPayload = {
      title: dto.title,
      agenda: dto.agenda ?? null,
      location: dto.location ?? null,
      scheduled_at,
      organizer_id: userId,
      status: "SCHEDULED",
    };

    let { data, error } = await supabase.from("meetings").insert(insertPayload).select("id").single();

    if (
      error &&
      /row-level security|violates row-level security|permission denied for table/i.test(error.message)
    ) {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        ({ data, error } = await admin.from("meetings").insert(insertPayload).select("id").single());
      }
    }

    throwIfSupabaseError(error);
    if (!data?.id) throw new BadRequestException("No se pudo crear la reunión.");

    await this.audit.append(accessToken, userId, {
      action: "meeting.create",
      resource_type: "meeting",
      resource_id: data.id,
    });

    return data;
  }

  async update(accessToken: string, actorId: string, meetingId: string, dto: UpdateMeetingDto) {
    const sb = createUserScopedClient(accessToken);
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.agenda !== undefined) patch.agenda = dto.agenda;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.scheduled_at !== undefined) {
      const raw = dto.scheduled_at?.trim();
      patch.scheduled_at =
        raw && raw.length > 0 ? new Date(raw).toISOString() : null;
    }
    if (dto.status !== undefined) patch.status = dto.status;

    let {
      data: updated,
      error,
    } = await sb.from("meetings").update(patch).eq("id", meetingId).select("id");

    if (
      error &&
      /row-level security|violates row-level security|permission denied for table/i.test(error.message)
    ) {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        ({ data: updated, error } = await admin.from("meetings").update(patch).eq("id", meetingId).select("id"));
      }
    }

    throwIfSupabaseError(error);

    if (!updated?.length) {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        const r2 = await admin.from("meetings").update(patch).eq("id", meetingId).select("id");
        throwIfSupabaseError(r2.error);
        updated = r2.data;
      }
    }

    if (!updated?.length) {
      throw new BadRequestException(
        "No se pudo actualizar la reunión (0 filas). Revisa rol admin/secretaría en Supabase y la migración 007.",
      );
    }

    await this.audit.append(accessToken, actorId, {
      action: "meeting.update",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }

  async remove(accessToken: string, actorId: string, meetingId: string) {
    const admin = tryCreateServiceRoleSupabaseClient();
    const sbUser = createUserScopedClient(accessToken);

    const listMinutes = async () => {
      const client = admin ?? sbUser;
      const { data, error } = await client
        .from("minutes")
        .select("id,status")
        .eq("meeting_id", meetingId);
      throwIfSupabaseError(error);
      return data ?? [];
    };

    const minutes = await listMinutes();
    const hasSignedOrClosed = minutes.some(
      (r: { status?: string }) => r.status === "SIGNED" || r.status === "CLOSED",
    );
    if (hasSignedOrClosed) {
      throw new BadRequestException(
        "No se puede eliminar la reunión: tiene minutas firmadas o cerradas. Use «Marcar como cancelada» o contacte al administrador.",
      );
    }

    if (admin) {
      const minuteIds = minutes.map((r: { id: string }) => r.id).filter(Boolean);
      if (minuteIds.length > 0) {
        const { error: e1 } = await admin.from("commitments").delete().in("minute_id", minuteIds);
        throwIfSupabaseError(e1);
        const { error: e2 } = await admin.from("signatures").delete().in("minute_id", minuteIds);
        throwIfSupabaseError(e2);
        const { error: e3 } = await admin.from("attachments").delete().in("minute_id", minuteIds);
        if (e3 && !/relation|does not exist|schema cache/i.test(e3.message ?? "")) {
          throwIfSupabaseError(e3);
        }
        const { error: e4, data: delMin } = await admin.from("minutes").delete().in("id", minuteIds).select("id");
        throwIfSupabaseError(e4);
        if ((delMin?.length ?? 0) !== minuteIds.length) {
          throw new BadRequestException(
            "No se pudieron eliminar todas las minutas (p. ej. firmadas o protegidas por reglas). Revise el estado de las minutas.",
          );
        }
      }
      const { error: e5 } = await admin.from("meeting_attendees").delete().eq("meeting_id", meetingId);
      throwIfSupabaseError(e5);
      const { error: e6, data: delMeet } = await admin.from("meetings").delete().eq("id", meetingId).select("id");
      throwIfSupabaseError(e6);
      if (!delMeet?.length) {
        throw new NotFoundException("Reunión no encontrada o ya eliminada.");
      }
    } else {
      if (minutes.length > 0) {
        throw new BadRequestException(
          "Para eliminar reuniones con minutas o compromisos vinculados, configure SUPABASE_SERVICE_ROLE_KEY en el backend (solo servidor). Sin esa clave la base no permite borrar firmas ni compromisos en cascada.",
        );
      }
      const { error: ea } = await sbUser.from("meeting_attendees").delete().eq("meeting_id", meetingId);
      throwIfSupabaseError(ea);
      let { error } = await sbUser.from("meetings").delete().eq("id", meetingId).select("id");
      if (
        error &&
        /row-level security|violates row-level security|permission denied for table/i.test(error.message)
      ) {
        throw new BadRequestException(
          "La base rechazó el borrado (RLS). Ejecute la migración 007 en Supabase o configure SUPABASE_SERVICE_ROLE_KEY.",
        );
      }
      throwIfSupabaseError(error);
      const verify = await sbUser.from("meetings").select("id").eq("id", meetingId).maybeSingle();
      throwIfSupabaseError(verify.error);
      if (verify.data) {
        throw new BadRequestException(
          "No se eliminó ninguna fila de reunión (permisos o datos relacionados). Configure SUPABASE_SERVICE_ROLE_KEY o revise políticas RLS.",
        );
      }
    }

    await this.audit.append(accessToken, actorId, {
      action: "meeting.delete",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }

  async listAttendees(accessToken: string, meetingId: string) {
    const sb = createUserScopedClient(accessToken);
    const { data, error } = await sb
      .from("meeting_attendees")
      .select("meeting_id,user_id,role,attended")
      .eq("meeting_id", meetingId);
    throwIfSupabaseError(error);
    return data ?? [];
  }

  async addAttendee(accessToken: string, actorId: string, meetingId: string, dto: AddAttendeeDto) {
    const sb = createUserScopedClient(accessToken);
    const { error } = await sb.from("meeting_attendees").insert({
      meeting_id: meetingId,
      user_id: dto.user_id,
      role: dto.role ?? null,
    });
    throwIfSupabaseError(error);

    await this.audit.append(accessToken, actorId, {
      action: "meeting.attendee_add",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }

  async removeAttendee(accessToken: string, actorId: string, meetingId: string, userId: string) {
    const sb = createUserScopedClient(accessToken);
    const { error } = await sb
      .from("meeting_attendees")
      .delete()
      .eq("meeting_id", meetingId)
      .eq("user_id", userId);
    throwIfSupabaseError(error);

    await this.audit.append(accessToken, actorId, {
      action: "meeting.attendee_remove",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }
}

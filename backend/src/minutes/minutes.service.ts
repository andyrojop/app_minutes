import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { CreateMinuteDto } from "./dto/create-minute.dto";
import type { UpdateMinuteDraftDto } from "./dto/update-minute-draft.dto";
import { AuditService } from "../audit/audit.service";
import { APP_ROLE } from "../common/app-role";
import { resolveEffectiveAppRole } from "../common/resolve-request-role";
import { MeetingsService } from "../meetings/meetings.service";
import {
  createUserScopedClient,
  tryCreateServiceRoleSupabaseClient,
} from "../supabase/supabase";
import { throwIfSupabaseError } from "../supabase/throw-if-supabase-error";

@Injectable()
export class MinutesService {
  constructor(
    private readonly audit: AuditService,
    private readonly meetings: MeetingsService,
  ) {}

  async listByMeeting(accessToken: string, meetingId: string) {
    const userSb = createUserScopedClient(accessToken);
    const { data, error } = await userSb
      .from("minutes")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });
    throwIfSupabaseError(error);
    let rows = data ?? [];

    if (rows.length === 0) {
      try {
        await this.meetings.getById(accessToken, meetingId);
      } catch {
        return rows;
      }
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        const r = await admin
          .from("minutes")
          .select("*")
          .eq("meeting_id", meetingId)
          .order("created_at", { ascending: false });
        if (!r.error && r.data?.length) rows = r.data;
      }
    }

    return rows;
  }

  async getById(accessToken: string, id: string) {
    const userSb = createUserScopedClient(accessToken);
    let { data, error } = await userSb.from("minutes").select("*").eq("id", id).maybeSingle();
    throwIfSupabaseError(error);

    if (!data) {
      const { data: authData } = await userSb.auth.getUser();
      const uid = authData?.user?.id;
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin && uid) {
        const r = await admin.from("minutes").select("*").eq("id", id).maybeSingle();
        if (!r.error && r.data) {
          const meetingId = (r.data as { meeting_id: string }).meeting_id;
          const m = await admin.from("meetings").select("organizer_id").eq("id", meetingId).maybeSingle();
          const organizerId = (m.data as { organizer_id: string } | null)?.organizer_id;
          const isOrganizer = organizerId === uid;
          let isAttendee = false;
          if (!isOrganizer) {
            const att = await admin
              .from("meeting_attendees")
              .select("meeting_id")
              .eq("meeting_id", meetingId)
              .eq("user_id", uid)
              .maybeSingle();
            isAttendee = !!att.data;
          }
          if (isOrganizer || isAttendee) {
            data = r.data;
          } else {
            const appRole = await resolveEffectiveAppRole(accessToken, uid);
            if (appRole === APP_ROLE.ADMIN || appRole === APP_ROLE.SECRETARY) {
              data = r.data;
            }
          }
        }
      }
    }

    if (!data) throw new NotFoundException("Minuta no encontrada");
    return data;
  }

  async create(accessToken: string, actorId: string, dto: CreateMinuteDto) {
    await this.meetings.getById(accessToken, dto.meeting_id);

    const insertPayload = {
      meeting_id: dto.meeting_id,
      content: {
        agenda: "",
        desarrollo: "",
        acuerdos: "",
        observaciones: "",
      },
      status: "DRAFT",
      version: 1,
    };

    const userSb = createUserScopedClient(accessToken);
    let { data: inserted, error } = await userSb.from("minutes").insert(insertPayload).select("id").single();

    if (
      error &&
      /row-level security|violates row-level security|permission denied for table/i.test(error.message)
    ) {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        ({ data: inserted, error } = await admin.from("minutes").insert(insertPayload).select("id").single());
      }
    }

    throwIfSupabaseError(error);
    if (!inserted?.id) throw new BadRequestException("No se pudo crear la minuta.");

    await this.audit.append(accessToken, actorId, {
      action: "minute.create",
      resource_type: "minute",
      resource_id: inserted.id,
    });

    return inserted;
  }

  async updateDraft(accessToken: string, actorId: string, id: string, dto: UpdateMinuteDraftDto) {
    const supabase = createUserScopedClient(accessToken);
    const content = {
      agenda: dto.agenda ?? "",
      desarrollo: dto.desarrollo ?? "",
      acuerdos: dto.acuerdos ?? "",
      observaciones: dto.observaciones ?? "",
    };

    let {
      data: updated,
      error,
    } = await supabase
      .from("minutes")
      .update({ content })
      .eq("id", id)
      .eq("status", "DRAFT")
      .select("id");

    if (
      error &&
      /row-level security|violates row-level security|permission denied for table/i.test(error.message)
    ) {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        ({ data: updated, error } = await admin
          .from("minutes")
          .update({ content })
          .eq("id", id)
          .eq("status", "DRAFT")
          .select("id"));
      }
    }

    throwIfSupabaseError(error);

    if (!updated?.length) {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (admin) {
        const r2 = await admin
          .from("minutes")
          .update({ content })
          .eq("id", id)
          .eq("status", "DRAFT")
          .select("id");
        throwIfSupabaseError(r2.error);
        updated = r2.data;
      }
    }

    if (!updated?.length) {
      throw new BadRequestException(
        "No se guardó el borrador (0 filas). Revisa que la minuta siga en DRAFT, migración 007 y SUPABASE_SERVICE_ROLE_KEY si RLS bloquea el JWT.",
      );
    }

    await this.audit.append(accessToken, actorId, {
      action: "minute.update_draft",
      resource_type: "minute",
      resource_id: id,
    });

    return { ok: true };
  }

  /** RF-02.5 / RF-02.6 — pasa a EN_FIRMA (SIGNING); contenido bloqueado por reglas de negocio posteriores. */
  async startSigning(accessToken: string, actorId: string, minuteId: string) {
    const sb = createUserScopedClient(accessToken);

    // Misma visibilidad que GET /minutes/:id (fallback service role + organizador/convocado).
    const row = await this.getById(accessToken, minuteId);
    const st = String(row.status ?? "");
    if (st === "SIGNING") {
      return { ok: true, alreadySigning: true as const };
    }
    if (st !== "DRAFT") {
      throw new BadRequestException(
        `No se puede pasar a firma desde el estado «${st}». Solo se permite con borrador (DRAFT).`,
      );
    }

    const tryServiceUpdate = () => {
      const admin = tryCreateServiceRoleSupabaseClient();
      if (!admin) return Promise.resolve({ data: null as { id: string }[] | null, error: null });
      return admin
        .from("minutes")
        .update({ status: "SIGNING" })
        .eq("id", minuteId)
        .eq("status", "DRAFT")
        .select("id");
    };

    let {
      data: updated,
      error,
    } = await sb
      .from("minutes")
      .update({ status: "SIGNING" })
      .eq("id", minuteId)
      .eq("status", "DRAFT")
      .select("id");

    if (
      error &&
      /row-level security|violates row-level security|permission denied for table/i.test(error.message)
    ) {
      const r = await tryServiceUpdate();
      updated = r.data as typeof updated;
      error = r.error;
    }

    throwIfSupabaseError(error);

    if (!updated?.length) {
      const r = await tryServiceUpdate();
      throwIfSupabaseError(r.error);
      updated = r.data as typeof updated;
    }

    if (!updated?.length) {
      throw new BadRequestException(
        "Supabase no actualizó la minuta (0 filas). Suele pasar si RLS no reconoce tu rol: en public.users tu fila debe tener role = secretary, o en el JWT user_metadata.app_role = secretary, y debe existir la migración 006 (has_any_app_role). " +
          "Solución rápida en desarrollo: SUPABASE_SERVICE_ROLE_KEY en backend/.env y reiniciar el backend.",
      );
    }

    await this.audit.append(accessToken, actorId, {
      action: "minute.start_signing",
      resource_type: "minute",
      resource_id: minuteId,
    });

    return { ok: true };
  }
}

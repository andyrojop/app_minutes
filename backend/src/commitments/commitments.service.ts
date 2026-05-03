import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { CreateCommitmentDto } from "./dto/create-commitment.dto";
import type { PatchCommitmentDto } from "./dto/patch-commitment.dto";
import { AuditService } from "../audit/audit.service";
import { APP_ROLE } from "../common/app-role";
import { resolveEffectiveAppRole } from "../common/resolve-request-role";
import { createUserScopedClient } from "../supabase/supabase";

@Injectable()
export class CommitmentsService {
  constructor(private readonly audit: AuditService) {}

  /** RF-03.2 — marca vencidos (ejecutado al consultar listados). */
  async expireOverdue(accessToken: string): Promise<void> {
    const sb = createUserScopedClient(accessToken);
    const today = new Date().toISOString().slice(0, 10);
    await sb
      .from("commitments")
      .update({ status: "vencido" })
      .in("status", ["pendiente", "en_progreso"])
      .lt("due_date", today);
  }

  async list(accessToken: string, minuteId?: string) {
    await this.expireOverdue(accessToken);
    const sb = createUserScopedClient(accessToken);
    let q = sb.from("commitments").select("*").order("due_date", { ascending: true });
    if (minuteId) q = q.eq("minute_id", minuteId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async listMine(accessToken: string, userId: string) {
    await this.expireOverdue(accessToken);
    const sb = createUserScopedClient(accessToken);
    const { data, error } = await sb
      .from("commitments")
      .select("*")
      .eq("assignee_id", userId)
      .order("due_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async create(accessToken: string, actorId: string, dto: CreateCommitmentDto) {
    const sb = createUserScopedClient(accessToken);
    const { data: minute } = await sb
      .from("minutes")
      .select("id")
      .eq("id", dto.minute_id)
      .maybeSingle();
    if (!minute) throw new NotFoundException("Minuta no encontrada");

    const { data: inserted, error } = await sb
      .from("commitments")
      .insert({
        minute_id: dto.minute_id,
        description: dto.description,
        assignee_id: dto.assignee_id,
        due_date: dto.due_date ?? null,
        priority: dto.priority ?? "media",
        status: "pendiente",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await this.audit.append(accessToken, actorId, {
      action: "commitment.create",
      resource_type: "commitment",
      resource_id: inserted.id,
    });

    return inserted;
  }

  async patch(accessToken: string, actorId: string, commitmentId: string, dto: PatchCommitmentDto) {
    const sb = createUserScopedClient(accessToken);
    const { data: row } = await sb
      .from("commitments")
      .select("assignee_id")
      .eq("id", commitmentId)
      .maybeSingle();
    if (!row) throw new NotFoundException("Compromiso no encontrado");

    const appRole = await resolveEffectiveAppRole(accessToken, actorId);
    const staff = appRole === APP_ROLE.ADMIN || appRole === APP_ROLE.SECRETARY;
    const assignee = row.assignee_id === actorId;

    if (!staff && !assignee) {
      throw new ForbiddenException("No puedes modificar este compromiso.");
    }

    const patch: Record<string, unknown> = {};
    if (dto.description !== undefined) {
      if (!staff) throw new ForbiddenException("Solo secretaría o administración puede editar la descripción.");
      patch.description = dto.description;
    }
    if (dto.status !== undefined) {
      patch.status = dto.status;
    }

    const { error } = await sb.from("commitments").update(patch).eq("id", commitmentId);
    if (error) throw new Error(error.message);

    await this.audit.append(accessToken, actorId, {
      action: "commitment.update",
      resource_type: "commitment",
      resource_id: commitmentId,
    });

    return { ok: true };
  }
}

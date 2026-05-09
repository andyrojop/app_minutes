import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuditLog } from "../models/audit-log.entity";

export type AuditPayload = {
  action: string;
  resource_type: string;
  resource_id?: string | null;
  ip?: string | null;
};

type AuditLogDto = {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip: string | null;
  created_at: string | null;
};

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

function toAuditDto(a: AuditLog & { actor?: unknown }): AuditLogDto {
  const actorId =
    typeof a.actor === "string"
      ? a.actor
      : (a.actor as { id?: string } | null | undefined)?.id ?? null;
  return {
    id: a.id,
    actor_id: actorId,
    action: a.action,
    resource_type: a.resourceType,
    resource_id: a.resourceId,
    ip: a.ip,
    created_at: toIso(a.createdAt),
  };
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async append(actorId: string, payload: AuditPayload): Promise<void> {
    try {
      await this.auditRepo.insert({
        actor: { id: actorId } as never,
        action: payload.action,
        resourceType: payload.resource_type,
        resourceId: payload.resource_id ?? null,
        ip: payload.ip ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[audit] omitido:", msg);
    }
  }

  async list(limit = 500): Promise<AuditLogDto[]> {
    const rows = await this.auditRepo.find({
      order: { createdAt: "DESC" },
      take: limit,
      loadRelationIds: { relations: ["actor"] },
    });
    return rows.map(toAuditDto);
  }
}

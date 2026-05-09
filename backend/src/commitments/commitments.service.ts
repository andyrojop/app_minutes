import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, Repository } from "typeorm";

import type { CreateCommitmentDto } from "./dto/create-commitment.dto";
import type { PatchCommitmentDto } from "./dto/patch-commitment.dto";
import { AuditService } from "../audit/audit.service";
import { APP_ROLE } from "../common/app-role";
import { RoleResolverService } from "../common/role-resolver.service";
import {
  Commitment,
  CommitmentStatusEnum,
  PriorityEnum,
} from "../models/commitment.entity";
import { Minute } from "../models/minute.entity";

function asPriority(value: string | undefined): PriorityEnum {
  switch (value) {
    case PriorityEnum.Alta:
    case PriorityEnum.Media:
    case PriorityEnum.Baja:
      return value;
    default:
      return PriorityEnum.Media;
  }
}

function asStatus(value: string): CommitmentStatusEnum | undefined {
  switch (value) {
    case CommitmentStatusEnum.Pendiente:
    case CommitmentStatusEnum.EnProgreso:
    case CommitmentStatusEnum.Cumplido:
    case CommitmentStatusEnum.Vencido:
      return value;
    default:
      return undefined;
  }
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

function toDateOnly(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

type CommitmentDto = {
  id: string;
  minute_id: string;
  description: string;
  assignee_id: string;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

function toCommitmentDto(c: Commitment & { minute?: unknown; assignee?: unknown }): CommitmentDto {
  const minuteId =
    typeof c.minute === "string" ? c.minute : (c.minute as { id?: string })?.id ?? "";
  const assigneeId =
    typeof c.assignee === "string" ? c.assignee : (c.assignee as { id?: string })?.id ?? "";
  return {
    id: c.id,
    minute_id: minuteId,
    description: c.description,
    assignee_id: assigneeId,
    due_date: toDateOnly(c.dueDate),
    priority: c.priority,
    status: c.status,
    created_at: toIso(c.createdAt),
    updated_at: toIso(c.updatedAt),
  };
}

@Injectable()
export class CommitmentsService {
  constructor(
    @InjectRepository(Commitment)
    private readonly commitments: Repository<Commitment>,
    @InjectRepository(Minute)
    private readonly minutes: Repository<Minute>,
    private readonly audit: AuditService,
    private readonly roleResolver: RoleResolverService,
  ) {}

  /** RF-03.2 — marca vencidos (ejecutado al consultar listados). */
  async expireOverdue(_accessToken?: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.commitments.update(
      {
        status: In([CommitmentStatusEnum.Pendiente, CommitmentStatusEnum.EnProgreso]),
        dueDate: LessThan(new Date(today)),
      },
      { status: CommitmentStatusEnum.Vencido },
    );
  }

  async list(accessToken: string, minuteId?: string): Promise<CommitmentDto[]> {
    await this.expireOverdue(accessToken);
    const where = minuteId ? { minute: { id: minuteId } } : {};
    const rows = await this.commitments.find({
      where,
      loadRelationIds: { relations: ["minute", "assignee"] },
      order: { dueDate: "ASC" },
    });
    return rows.map(toCommitmentDto);
  }

  async listMine(accessToken: string, userId: string): Promise<CommitmentDto[]> {
    await this.expireOverdue(accessToken);
    const rows = await this.commitments.find({
      where: { assignee: { id: userId } },
      loadRelationIds: { relations: ["minute", "assignee"] },
      order: { dueDate: "ASC" },
    });
    return rows.map(toCommitmentDto);
  }

  async create(actorId: string, dto: CreateCommitmentDto) {
    const minuteExists = await this.minutes.exist({ where: { id: dto.minute_id } });
    if (!minuteExists) throw new NotFoundException("Minuta no encontrada");

    const inserted = await this.commitments.save(
      this.commitments.create({
        minute: { id: dto.minute_id } as Minute,
        description: dto.description,
        assignee: { id: dto.assignee_id } as never,
        dueDate: dto.due_date ? new Date(dto.due_date) : null,
        priority: asPriority(dto.priority),
        status: CommitmentStatusEnum.Pendiente,
      }),
    );

    await this.audit.append(actorId, {
      action: "commitment.create",
      resource_type: "commitment",
      resource_id: inserted.id,
    });

    return { id: inserted.id };
  }

  async patch(
    accessToken: string,
    actorId: string,
    commitmentId: string,
    dto: PatchCommitmentDto,
  ) {
    const row = await this.commitments.findOne({
      where: { id: commitmentId },
      loadRelationIds: { relations: ["assignee"] },
    });
    if (!row) throw new NotFoundException("Compromiso no encontrado");

    const appRole = await this.roleResolver.resolve(accessToken, actorId);
    const staff = appRole === APP_ROLE.ADMIN || appRole === APP_ROLE.SECRETARY;
    const assigneeId =
      typeof row.assignee === "string"
        ? row.assignee
        : (row.assignee as { id?: string } | undefined)?.id;
    const isAssignee = assigneeId === actorId;

    if (!staff && !isAssignee) {
      throw new ForbiddenException("No puedes modificar este compromiso.");
    }

    const patch: Partial<Commitment> = {};
    if (dto.description !== undefined) {
      if (!staff) {
        throw new ForbiddenException("Solo secretaría o administración puede editar la descripción.");
      }
      patch.description = dto.description;
    }
    if (dto.status !== undefined) {
      const next = asStatus(dto.status);
      if (next) patch.status = next;
    }

    if (Object.keys(patch).length > 0) {
      await this.commitments.update({ id: commitmentId }, patch);
    }

    await this.audit.append(actorId, {
      action: "commitment.update",
      resource_type: "commitment",
      resource_id: commitmentId,
    });

    return { ok: true };
  }
}

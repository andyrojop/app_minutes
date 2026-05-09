import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type { CreateMinuteDto } from "./dto/create-minute.dto";
import type { UpdateMinuteDraftDto } from "./dto/update-minute-draft.dto";
import { AuditService } from "../audit/audit.service";
import { APP_ROLE, type AppRole } from "../common/app-role";
import { RoleResolverService } from "../common/role-resolver.service";
import { Meeting } from "../models/meeting.entity";
import { MeetingAttendee } from "../models/meeting-attendee.entity";
import { Minute, MinuteStatusEnum } from "../models/minute.entity";

const STAFF_ROLES: AppRole[] = [APP_ROLE.ADMIN, APP_ROLE.SECRETARY];
const VIEWER_ROLES = ["admin", "secretary", "auditor"] as const;

function isStaff(role: AppRole | null): boolean {
  return role !== null && STAFF_ROLES.includes(role);
}

function isViewer(role: AppRole | null): boolean {
  return role !== null && (VIEWER_ROLES as readonly string[]).includes(role);
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

type MinuteDto = {
  id: string;
  meeting_id: string;
  content: unknown;
  version: number;
  status: string;
  content_hash: string | null;
  signed_pdf_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function toMinuteDto(m: Minute & { meeting?: unknown }): MinuteDto {
  const meetingId =
    typeof m.meeting === "string" ? m.meeting : (m.meeting as { id?: string })?.id ?? "";
  return {
    id: m.id,
    meeting_id: meetingId,
    content: m.content,
    version: m.version,
    status: m.status,
    content_hash: m.contentHash,
    signed_pdf_url: m.signedPdfUrl,
    created_at: toIso(m.createdAt),
    updated_at: toIso(m.updatedAt),
  };
}

@Injectable()
export class MinutesService {
  constructor(
    @InjectRepository(Minute) private readonly minutes: Repository<Minute>,
    @InjectRepository(Meeting) private readonly meetings: Repository<Meeting>,
    @InjectRepository(MeetingAttendee)
    private readonly attendees: Repository<MeetingAttendee>,
    private readonly audit: AuditService,
    private readonly roleResolver: RoleResolverService,
  ) {}

  /** True si el usuario puede VER el contenido del meeting (organizer, asistente o staff/auditor). */
  private async canAccessMeeting(
    userId: string,
    role: AppRole | null,
    meetingId: string,
  ): Promise<boolean> {
    if (isViewer(role)) return true;
    const meeting = await this.meetings.findOne({
      where: { id: meetingId },
      loadRelationIds: { relations: ["organizer"] },
    });
    if (!meeting) return false;
    const organizerId =
      typeof meeting.organizer === "string"
        ? meeting.organizer
        : (meeting.organizer as { id?: string })?.id;
    if (organizerId === userId) return true;
    return this.attendees.exist({
      where: { meetingId, userId },
    });
  }

  async listByMeeting(
    accessToken: string,
    userId: string,
    meetingId: string,
  ): Promise<MinuteDto[]> {
    const role = await this.roleResolver.resolve(accessToken, userId);
    const canAccess = await this.canAccessMeeting(userId, role, meetingId);
    if (!canAccess) return [];
    const rows = await this.minutes.find({
      where: { meeting: { id: meetingId } },
      loadRelationIds: { relations: ["meeting"] },
      order: { createdAt: "DESC" },
    });
    return rows.map(toMinuteDto);
  }

  async getById(accessToken: string, userId: string, id: string): Promise<MinuteDto> {
    const minute = await this.minutes.findOne({
      where: { id },
      loadRelationIds: { relations: ["meeting"] },
    });
    if (!minute) throw new NotFoundException("Minuta no encontrada");

    const meetingId =
      typeof minute.meeting === "string"
        ? minute.meeting
        : (minute.meeting as { id?: string })?.id ?? "";
    const role = await this.roleResolver.resolve(accessToken, userId);
    const canAccess = await this.canAccessMeeting(userId, role, meetingId);
    if (!canAccess) throw new NotFoundException("Minuta no encontrada");
    return toMinuteDto(minute);
  }

  async create(actorId: string, dto: CreateMinuteDto) {
    const meetingExists = await this.meetings.exist({ where: { id: dto.meeting_id } });
    if (!meetingExists) throw new NotFoundException("Reunión no encontrada");

    const inserted = await this.minutes.save(
      this.minutes.create({
        meeting: { id: dto.meeting_id } as Meeting,
        content: {
          agenda: "",
          desarrollo: "",
          acuerdos: "",
          observaciones: "",
        },
        version: 1,
        status: MinuteStatusEnum.Draft,
      }),
    );

    await this.audit.append(actorId, {
      action: "minute.create",
      resource_type: "minute",
      resource_id: inserted.id,
    });

    return { id: inserted.id };
  }

  async updateDraft(actorId: string, id: string, dto: UpdateMinuteDraftDto) {
    const content = {
      agenda: dto.agenda ?? "",
      desarrollo: dto.desarrollo ?? "",
      acuerdos: dto.acuerdos ?? "",
      observaciones: dto.observaciones ?? "",
    };

    const result = await this.minutes.update(
      { id, status: MinuteStatusEnum.Draft },
      { content },
    );
    if (!result.affected) {
      throw new BadRequestException(
        "No se guardó el borrador. Verifica que la minuta exista y siga en estado DRAFT.",
      );
    }

    await this.audit.append(actorId, {
      action: "minute.update_draft",
      resource_type: "minute",
      resource_id: id,
    });

    return { ok: true };
  }

  /** RF-02.5 / RF-02.6 — pasa a EN_FIRMA (SIGNING); contenido bloqueado por trigger inmutabilidad. */
  async startSigning(accessToken: string, actorId: string, minuteId: string) {
    const minute = await this.minutes.findOne({
      where: { id: minuteId },
    });
    if (!minute) throw new NotFoundException("Minuta no encontrada");

    const role = await this.roleResolver.resolve(accessToken, actorId);
    if (!isStaff(role)) {
      throw new ForbiddenException("Solo administración o secretaría puede pasar a firma.");
    }

    if (minute.status === MinuteStatusEnum.Signing) {
      return { ok: true, alreadySigning: true as const };
    }
    if (minute.status !== MinuteStatusEnum.Draft) {
      throw new BadRequestException(
        `No se puede pasar a firma desde el estado «${minute.status}». Solo se permite con borrador (DRAFT).`,
      );
    }

    const result = await this.minutes.update(
      { id: minuteId, status: MinuteStatusEnum.Draft },
      { status: MinuteStatusEnum.Signing },
    );
    if (!result.affected) {
      throw new BadRequestException("No se pudo cambiar el estado de la minuta.");
    }

    await this.audit.append(actorId, {
      action: "minute.start_signing",
      resource_type: "minute",
      resource_id: minuteId,
    });

    return { ok: true };
  }
}

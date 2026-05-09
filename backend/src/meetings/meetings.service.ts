import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import type { AddAttendeeDto } from "./dto/add-attendee.dto";
import type { CreateMeetingDto } from "./dto/create-meeting.dto";
import type { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { AuditService } from "../audit/audit.service";
import { APP_ROLE, type AppRole } from "../common/app-role";
import { RoleResolverService } from "../common/role-resolver.service";
import { Meeting, MeetingStatusEnum } from "../models/meeting.entity";
import { MeetingAttendee } from "../models/meeting-attendee.entity";
import { Minute, MinuteStatusEnum } from "../models/minute.entity";

const VIEWER_ROLES = ["admin", "secretary", "auditor"] as const;

function isViewer(role: AppRole | null): boolean {
  return role !== null && (VIEWER_ROLES as readonly string[]).includes(role);
}

function asMeetingStatus(value: string | undefined): MeetingStatusEnum | undefined {
  switch (value) {
    case MeetingStatusEnum.Scheduled:
    case MeetingStatusEnum.Ongoing:
    case MeetingStatusEnum.Finished:
    case MeetingStatusEnum.Cancelled:
      return value;
    default:
      return undefined;
  }
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

type MeetingDto = {
  id: string;
  title: string;
  agenda: string | null;
  location: string | null;
  scheduled_at: string | null;
  organizer_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

function toMeetingDto(m: Meeting & { organizer?: unknown }): MeetingDto {
  // Cuando se usa loadRelationIds, `organizer` viene como string (uuid).
  const organizerId =
    typeof m.organizer === "string" ? m.organizer : (m.organizer as { id?: string })?.id ?? "";
  return {
    id: m.id,
    title: m.title,
    agenda: m.agenda,
    location: m.location,
    scheduled_at: toIso(m.scheduledAt),
    organizer_id: organizerId,
    status: m.status,
    created_at: toIso(m.createdAt),
    updated_at: toIso(m.updatedAt),
  };
}

type AttendeeDto = {
  meeting_id: string;
  user_id: string;
  role: string | null;
  attended: boolean | null;
};

function toAttendeeDto(a: MeetingAttendee): AttendeeDto {
  return {
    meeting_id: a.meetingId,
    user_id: a.userId,
    role: a.role,
    attended: a.attended,
  };
}

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting) private readonly meetings: Repository<Meeting>,
    @InjectRepository(MeetingAttendee)
    private readonly attendees: Repository<MeetingAttendee>,
    @InjectRepository(Minute) private readonly minutes: Repository<Minute>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly roleResolver: RoleResolverService,
  ) {}

  async list(accessToken: string, userId: string): Promise<MeetingDto[]> {
    const role = await this.roleResolver.resolve(accessToken, userId);

    if (isViewer(role)) {
      const rows = await this.meetings.find({
        loadRelationIds: { relations: ["organizer"] },
        order: { scheduledAt: "ASC" },
      });
      return rows.map(toMeetingDto);
    }

    // Usuario común: solo donde es organizador o asistente.
    const rows = await this.meetings
      .createQueryBuilder("m")
      .leftJoin("m.attendees", "ma", "ma.user_id = :uid", { uid: userId })
      .where("m.organizer_id = :uid", { uid: userId })
      .orWhere("ma.user_id = :uid", { uid: userId })
      .orderBy("m.scheduled_at", "ASC")
      .loadAllRelationIds({ relations: ["organizer"] })
      .getMany();
    return rows.map(toMeetingDto);
  }

  async getById(accessToken: string, userId: string, id: string): Promise<MeetingDto> {
    const meeting = await this.meetings.findOne({
      where: { id },
      loadRelationIds: { relations: ["organizer"] },
    });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");

    const role = await this.roleResolver.resolve(accessToken, userId);
    const organizerId =
      typeof meeting.organizer === "string"
        ? meeting.organizer
        : (meeting.organizer as { id?: string })?.id;
    if (isViewer(role) || organizerId === userId) {
      return toMeetingDto(meeting);
    }
    const attended = await this.attendees.exist({
      where: { meetingId: id, userId },
    });
    if (!attended) throw new NotFoundException("Reunión no encontrada");

    return toMeetingDto(meeting);
  }

  async create(userId: string, dto: CreateMeetingDto) {
    let scheduledAt: Date | null = null;
    const raw = dto.scheduled_at?.trim();
    if (raw) {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException("scheduled_at no es una fecha válida");
      }
      scheduledAt = d;
    }
    if (!scheduledAt) {
      throw new BadRequestException("scheduled_at es obligatorio");
    }

    const inserted = await this.meetings.save(
      this.meetings.create({
        title: dto.title,
        agenda: dto.agenda ?? null,
        location: dto.location ?? null,
        scheduledAt,
        organizer: { id: userId } as never,
        status: MeetingStatusEnum.Scheduled,
      }),
    );

    await this.audit.append(userId, {
      action: "meeting.create",
      resource_type: "meeting",
      resource_id: inserted.id,
    });

    return { id: inserted.id };
  }

  async update(actorId: string, meetingId: string, dto: UpdateMeetingDto) {
    const patch: Partial<Meeting> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.agenda !== undefined) patch.agenda = dto.agenda;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.scheduled_at !== undefined) {
      const raw = dto.scheduled_at?.trim();
      patch.scheduledAt = raw && raw.length > 0 ? new Date(raw) : (null as never);
    }
    if (dto.status !== undefined) {
      const next = asMeetingStatus(dto.status);
      if (next) patch.status = next;
    }

    if (Object.keys(patch).length === 0) {
      return { ok: true };
    }

    const result = await this.meetings.update({ id: meetingId }, patch);
    if (!result.affected) {
      throw new NotFoundException("Reunión no encontrada");
    }

    await this.audit.append(actorId, {
      action: "meeting.update",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }

  async remove(actorId: string, meetingId: string) {
    return this.dataSource.transaction(async (em) => {
      const meeting = await em.findOne(Meeting, {
        where: { id: meetingId },
        relations: { minutes: true },
      });
      if (!meeting) throw new NotFoundException("Reunión no encontrada");

      const blocking = meeting.minutes.some(
        (m) =>
          m.status === MinuteStatusEnum.Signed || m.status === MinuteStatusEnum.Closed,
      );
      if (blocking) {
        throw new BadRequestException(
          "No se puede eliminar la reunión: tiene minutas firmadas o cerradas. Use «Marcar como cancelada».",
        );
      }

      // FK ON DELETE CASCADE limpia attendees, minutes, commitments, signatures, attachments.
      await em.remove(meeting);

      await this.audit.append(actorId, {
        action: "meeting.delete",
        resource_type: "meeting",
        resource_id: meetingId,
      });

      return { ok: true };
    });
  }

  async listAttendees(meetingId: string): Promise<AttendeeDto[]> {
    const rows = await this.attendees.find({
      where: { meetingId },
    });
    return rows.map(toAttendeeDto);
  }

  async addAttendee(actorId: string, meetingId: string, dto: AddAttendeeDto) {
    await this.attendees.upsert(
      {
        meetingId,
        userId: dto.user_id,
        role: dto.role ?? null,
      },
      ["meetingId", "userId"],
    );

    await this.audit.append(actorId, {
      action: "meeting.attendee_add",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }

  async removeAttendee(actorId: string, meetingId: string, userId: string) {
    await this.attendees.delete({ meetingId, userId });

    await this.audit.append(actorId, {
      action: "meeting.attendee_remove",
      resource_type: "meeting",
      resource_id: meetingId,
    });

    return { ok: true };
  }
}

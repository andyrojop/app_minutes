import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from "typeorm";

import { AuditLog } from "./audit-log.entity";
import { Attachment } from "./attachment.entity";
import { Commitment } from "./commitment.entity";
import { Meeting } from "./meeting.entity";
import { MeetingAttendee } from "./meeting-attendee.entity";
import { Signature } from "./signature.entity";

export enum UserRoleEnum {
  Admin = "admin",
  Secretary = "secretary",
  Auditor = "auditor",
}

@Entity("users")
export class User {
  // id matches auth.users.id (Supabase Auth). Trigger on_auth_user_created
  // keeps both rows in sync.
  @PrimaryColumn("uuid")
  id: string;

  @Index("idx_users_email", { unique: true })
  @Column({ type: "text", nullable: false })
  email: string;

  @Column({
    type: "enum",
    enum: UserRoleEnum,
    enumName: "user_role_enum",
    nullable: false,
    default: UserRoleEnum.Secretary,
  })
  role: UserRoleEnum;

  @Column({ name: "is_active", type: "boolean", nullable: false, default: true })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    name: "created_at",
  })
  createdAt: Date;

  @OneToMany(() => Meeting, (m) => m.organizer)
  meetings: Meeting[];

  @OneToMany(() => MeetingAttendee, (ma) => ma.user)
  meetingAttendees: MeetingAttendee[];

  @OneToMany(() => Commitment, (c) => c.assignee)
  commitments: Commitment[];

  @OneToMany(() => Signature, (s) => s.signer)
  signatures: Signature[];

  @OneToMany(() => Attachment, (a) => a.uploadedBy)
  attachments: Attachment[];

  @OneToMany(() => AuditLog, (a) => a.actor)
  auditLogs: AuditLog[];
}

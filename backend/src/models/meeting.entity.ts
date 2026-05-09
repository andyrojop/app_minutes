import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MeetingAttendee } from "./meeting-attendee.entity";
import { Minute } from "./minute.entity";
import { User } from "./user.entity";

export enum MeetingStatusEnum {
  Scheduled = "SCHEDULED",
  Ongoing = "ONGOING",
  Finished = "FINISHED",
  Cancelled = "CANCELLED",
}

@Entity("meetings")
export class Meeting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: false })
  title: string;

  @Column({ type: "text", nullable: true })
  agenda: string | null;

  @Column({ type: "text", nullable: true })
  location: string | null;

  @Index("idx_meetings_scheduled_at")
  @Column({ name: "scheduled_at", type: "timestamptz", nullable: false })
  scheduledAt: Date;

  @ManyToOne(() => User, (u) => u.meetings, { nullable: false })
  @JoinColumn({ name: "organizer_id" })
  @Index("idx_meetings_organizer")
  organizer: User;

  @Column({
    type: "enum",
    enum: MeetingStatusEnum,
    enumName: "meeting_status_enum",
    nullable: false,
    default: MeetingStatusEnum.Scheduled,
  })
  @Index("idx_meetings_status")
  status: MeetingStatusEnum;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    name: "created_at",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
    name: "updated_at",
  })
  updatedAt: Date;

  @OneToMany(() => MeetingAttendee, (ma) => ma.meeting)
  attendees: MeetingAttendee[];

  @OneToMany(() => Minute, (m) => m.meeting)
  minutes: Minute[];
}

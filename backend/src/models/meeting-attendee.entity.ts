import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { Meeting } from "./meeting.entity";
import { User } from "./user.entity";

@Entity("meeting_attendees")
export class MeetingAttendee {
  @PrimaryColumn({ name: "meeting_id", type: "uuid" })
  meetingId: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "text", nullable: true })
  role: string | null;

  @Column({ type: "boolean", nullable: true })
  attended: boolean | null;

  @ManyToOne(() => Meeting, (m) => m.attendees, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meeting_id" })
  @Index("idx_meeting_attendees_meeting")
  meeting: Meeting;

  @ManyToOne(() => User, (u) => u.meetingAttendees, { nullable: false })
  @JoinColumn({ name: "user_id" })
  @Index("idx_meeting_attendees_user")
  user: User;
}

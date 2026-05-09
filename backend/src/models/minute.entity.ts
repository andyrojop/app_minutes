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

import { Attachment } from "./attachment.entity";
import { Commitment } from "./commitment.entity";
import { Meeting } from "./meeting.entity";
import { Signature } from "./signature.entity";

export enum MinuteStatusEnum {
  Draft = "DRAFT",
  Signing = "SIGNING",
  Signed = "SIGNED",
  Closed = "CLOSED",
}

export interface MinuteContent {
  agenda: string;
  desarrollo: string;
  acuerdos: string;
  observaciones: string;
}

@Entity("minutes")
export class Minute {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Meeting, (m) => m.minutes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meeting_id" })
  @Index("idx_minutes_meeting")
  meeting: Meeting;

  @Column({ type: "jsonb", nullable: false })
  content: MinuteContent;

  @Column({ type: "integer", nullable: false, default: 1 })
  version: number;

  @Column({
    type: "enum",
    enum: MinuteStatusEnum,
    enumName: "minute_status_enum",
    nullable: false,
    default: MinuteStatusEnum.Draft,
  })
  @Index("idx_minutes_status")
  status: MinuteStatusEnum;

  @Column({ name: "content_hash", type: "text", nullable: true })
  contentHash: string | null;

  @Column({ name: "signed_pdf_url", type: "text", nullable: true })
  signedPdfUrl: string | null;

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

  @OneToMany(() => Commitment, (c) => c.minute)
  commitments: Commitment[];

  @OneToMany(() => Signature, (s) => s.minute)
  signatures: Signature[];

  @OneToMany(() => Attachment, (a) => a.minute)
  attachments: Attachment[];
}

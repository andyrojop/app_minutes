import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Minute } from "./minute.entity";
import { User } from "./user.entity";

@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Minute, (m) => m.attachments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "minute_id" })
  @Index("idx_attachments_minute")
  minute: Minute;

  @Column({ type: "text", nullable: false })
  filename: string;

  @Column({ name: "mime_type", type: "text", nullable: false })
  mimeType: string;

  @Column({ name: "storage_key", type: "text", nullable: false })
  storageKey: string;

  @ManyToOne(() => User, (u) => u.attachments, { nullable: false })
  @JoinColumn({ name: "uploaded_by" })
  @Index("idx_attachments_uploaded_by")
  uploadedBy: User;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    name: "created_at",
  })
  createdAt: Date;
}

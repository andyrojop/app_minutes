import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Minute } from "./minute.entity";
import { User } from "./user.entity";

export enum PriorityEnum {
  Alta = "alta",
  Media = "media",
  Baja = "baja",
}

export enum CommitmentStatusEnum {
  Pendiente = "pendiente",
  EnProgreso = "en_progreso",
  Cumplido = "cumplido",
  Vencido = "vencido",
}

@Entity("commitments")
export class Commitment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Minute, (m) => m.commitments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "minute_id" })
  @Index("idx_commitments_minute")
  minute: Minute;

  @Column({ type: "text", nullable: false })
  description: string;

  @ManyToOne(() => User, (u) => u.commitments, { nullable: false })
  @JoinColumn({ name: "assignee_id" })
  @Index("idx_commitments_assignee")
  assignee: User;

  @Index("idx_commitments_due_date")
  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date | null;

  @Column({
    type: "enum",
    enum: PriorityEnum,
    enumName: "priority_enum",
    nullable: false,
    default: PriorityEnum.Media,
  })
  priority: PriorityEnum;

  @Column({
    type: "enum",
    enum: CommitmentStatusEnum,
    enumName: "commitment_status_enum",
    nullable: false,
    default: CommitmentStatusEnum.Pendiente,
  })
  @Index("idx_commitments_status")
  status: CommitmentStatusEnum;

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
}

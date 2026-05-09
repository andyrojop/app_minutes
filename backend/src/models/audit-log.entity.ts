import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("audit_log")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (u) => u.auditLogs, { nullable: true })
  @JoinColumn({ name: "actor_id" })
  @Index("idx_audit_log_actor")
  actor: User | null;

  @Index("idx_audit_log_action")
  @Column({ type: "text", nullable: false })
  action: string;

  @Column({ name: "resource_type", type: "text", nullable: false })
  resourceType: string;

  @Column({ name: "resource_id", type: "uuid", nullable: true })
  resourceId: string | null;

  @Column({ type: "text", nullable: true })
  ip: string | null;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    name: "created_at",
  })
  createdAt: Date;
}

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

export interface SignatureMetadata {
  ip: string | null;
  signed_at_server: string;
}

@Entity("signatures")
export class Signature {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Minute, (m) => m.signatures, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "minute_id" })
  @Index("idx_signatures_minute")
  minute: Minute;

  @ManyToOne(() => User, (u) => u.signatures, { nullable: false })
  @JoinColumn({ name: "signer_id" })
  @Index("idx_signatures_signer")
  signer: User;

  @Column({ name: "signature_svg", type: "text", nullable: true })
  signatureSvg: string | null;

  @Column({ name: "signature_png", type: "text", nullable: true })
  signaturePng: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: SignatureMetadata | null;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    name: "signed_at",
  })
  signedAt: Date;
}

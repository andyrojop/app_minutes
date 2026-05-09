import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type { CreateSignatureDto } from "./dto/create-signature.dto";
import { AuditService } from "../audit/audit.service";
import { Signature } from "../models/signature.entity";

export type SignatureListRow = {
  id: string;
  minute_id: string;
  signer_id: string;
  signature_svg: string | null;
  signed_at: string;
  metadata: Record<string, unknown> | null;
  signer_email: string | null;
};

@Injectable()
export class SignaturesService {
  constructor(
    @InjectRepository(Signature)
    private readonly signatures: Repository<Signature>,
    private readonly audit: AuditService,
  ) {}

  async listByMinute(minuteId: string): Promise<SignatureListRow[]> {
    const rows = await this.signatures
      .createQueryBuilder("s")
      .leftJoin("s.signer", "u")
      .leftJoin("s.minute", "m")
      .select([
        "s.id AS id",
        "m.id AS minute_id",
        "u.id AS signer_id",
        "s.signatureSvg AS signature_svg",
        "s.signedAt AS signed_at",
        "s.metadata AS metadata",
        "u.email AS signer_email",
      ])
      .where("m.id = :minuteId", { minuteId })
      .orderBy("s.signedAt", "ASC")
      .getRawMany<{
        id: string;
        minute_id: string;
        signer_id: string;
        signature_svg: string | null;
        signed_at: Date | string;
        metadata: Record<string, unknown> | null;
        signer_email: string | null;
      }>();

    return rows.map((r) => ({
      id: r.id,
      minute_id: r.minute_id,
      signer_id: r.signer_id,
      signature_svg: r.signature_svg,
      signed_at: r.signed_at instanceof Date ? r.signed_at.toISOString() : r.signed_at,
      metadata: r.metadata,
      signer_email: r.signer_email,
    }));
  }

  async create(signerId: string, dto: CreateSignatureDto, ip?: string | null) {
    const signedAt = new Date();
    const inserted = await this.signatures.save(
      this.signatures.create({
        minute: { id: dto.minute_id } as never,
        signer: { id: signerId } as never,
        signatureSvg: dto.signature_svg ?? null,
        signaturePng: dto.signature_png ?? null,
        metadata: {
          ip: ip ?? null,
          signed_at_server: signedAt.toISOString(),
        },
        signedAt,
      }),
    );

    await this.audit.append(signerId, {
      action: "signature.create",
      resource_type: "minute",
      resource_id: dto.minute_id,
      ip: ip ?? null,
    });

    return { id: inserted.id };
  }
}

import { Injectable } from "@nestjs/common";

import type { CreateSignatureDto } from "./dto/create-signature.dto";
import { AuditService } from "../audit/audit.service";
import { createUserScopedClient } from "../supabase/supabase";

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
  constructor(private readonly audit: AuditService) {}

  async listByMinute(accessToken: string, minuteId: string): Promise<SignatureListRow[]> {
    const sb = createUserScopedClient(accessToken);
    const { data: rows, error } = await sb
      .from("signatures")
      .select("id, minute_id, signer_id, signature_svg, signed_at, metadata")
      .eq("minute_id", minuteId)
      .order("signed_at", { ascending: true });

    if (error) throw new Error(error.message);
    const list = (rows ?? []) as Omit<SignatureListRow, "signer_email">[];

    const signerIds = [...new Set(list.map((r) => r.signer_id).filter(Boolean))];
    const emails: Record<string, string> = {};
    if (signerIds.length > 0) {
      const u = await sb.from("users").select("id, email").in("id", signerIds);
      if (!u.error && u.data) {
        for (const row of u.data as { id: string; email: string | null }[]) {
          emails[row.id] = typeof row.email === "string" ? row.email : "";
        }
      }
    }

    return list.map((r) => ({
      ...r,
      signer_email: emails[r.signer_id] ?? null,
    }));
  }

  async create(
    accessToken: string,
    signerId: string,
    dto: CreateSignatureDto,
    ip?: string | null,
  ) {
    const sb = createUserScopedClient(accessToken);
    const signedAt = new Date().toISOString();
    const { data, error } = await sb
      .from("signatures")
      .insert({
        minute_id: dto.minute_id,
        signer_id: signerId,
        signature_svg: dto.signature_svg ?? null,
        signature_png: dto.signature_png ?? null,
        metadata: {
          ip: ip ?? null,
          signed_at_server: signedAt,
        },
        signed_at: signedAt,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await this.audit.append(accessToken, signerId, {
      action: "signature.create",
      resource_type: "minute",
      resource_id: dto.minute_id,
      ip: ip ?? null,
    });

    return data;
  }
}

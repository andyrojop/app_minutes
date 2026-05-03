import { Injectable } from "@nestjs/common";

import { createUserScopedClient } from "../supabase/supabase";

export type AuditPayload = {
  action: string;
  resource_type: string;
  resource_id?: string | null;
  ip?: string | null;
};

@Injectable()
export class AuditService {
  async append(accessToken: string, actorId: string, payload: AuditPayload): Promise<void> {
    const sb = createUserScopedClient(accessToken);
    const { error } = await sb.from("audit_log").insert({
      actor_id: actorId,
      action: payload.action,
      resource_type: payload.resource_type,
      resource_id: payload.resource_id ?? null,
      ip: payload.ip ?? null,
    });
    if (error) {
      console.warn("[audit] omitido:", error.message);
    }
  }
}

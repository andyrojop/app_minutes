import { Controller, Get, Req, UseGuards } from "@nestjs/common";

import type { AuthedRequest } from "../auth/supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { createUserScopedClient } from "../supabase/supabase";

@Controller("audit-log")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(APP_ROLE.ADMIN)
export class AuditLogController {
  @Get()
  async list(@Req() req: AuthedRequest) {
    const sb = createUserScopedClient(req.accessToken);
    const { data, error } = await sb
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  }
}

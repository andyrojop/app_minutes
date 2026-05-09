import { Controller, Get, UseGuards } from "@nestjs/common";

import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuditService } from "./audit.service";

@Controller("audit-log")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(APP_ROLE.ADMIN)
export class AuditLogController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async list() {
    return this.audit.list(500);
  }
}

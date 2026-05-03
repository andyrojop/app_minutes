import { Controller, Get, Req, UseGuards } from "@nestjs/common";

import type { AuthedRequest } from "../auth/supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("dashboard")
  dashboard(@Req() req: AuthedRequest) {
    return this.reports.dashboard(req.accessToken);
  }
}

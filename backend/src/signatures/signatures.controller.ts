import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";

import type { AuthedRequest } from "../auth/supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateSignatureDto } from "./dto/create-signature.dto";
import { SignaturesService } from "./signatures.service";

@Controller("signatures")
@UseGuards(SupabaseAuthGuard)
export class SignaturesController {
  constructor(private readonly signatures: SignaturesService) {}

  @Get("minute/:minuteId")
  listByMinute(@Param("minuteId") minuteId: string) {
    return this.signatures.listByMinute(minuteId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  create(@Req() req: AuthedRequest, @Body() dto: CreateSignatureDto) {
    const ip =
      (typeof req.ip === "string" && req.ip) ||
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      null;
    return this.signatures.create(req.user.sub, dto, ip);
  }
}

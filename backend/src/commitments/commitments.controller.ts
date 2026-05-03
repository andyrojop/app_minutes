import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import type { AuthedRequest } from "../auth/supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateCommitmentDto } from "./dto/create-commitment.dto";
import { PatchCommitmentDto } from "./dto/patch-commitment.dto";
import { CommitmentsService } from "./commitments.service";

@Controller("commitments")
@UseGuards(SupabaseAuthGuard)
export class CommitmentsController {
  constructor(private readonly commitments: CommitmentsService) {}

  /** Panel del firmante (ruta estática antes del listado genérico). */
  @Get("me")
  listMine(@Req() req: AuthedRequest) {
    return this.commitments.listMine(req.accessToken, req.user.sub);
  }

  @Get()
  list(@Req() req: AuthedRequest, @Query("minute_id") minuteId?: string) {
    return this.commitments.list(req.accessToken, minuteId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  create(@Req() req: AuthedRequest, @Body() dto: CreateCommitmentDto) {
    return this.commitments.create(req.accessToken, req.user.sub, dto);
  }

  @Patch(":id")
  patch(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: PatchCommitmentDto,
  ) {
    return this.commitments.patch(req.accessToken, req.user.sub, id, dto);
  }
}

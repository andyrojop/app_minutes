import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import type { AuthedRequest } from "../auth/supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateMinuteDto } from "./dto/create-minute.dto";
import { UpdateMinuteDraftDto } from "./dto/update-minute-draft.dto";
import { MinutesService } from "./minutes.service";

@Controller("minutes")
@UseGuards(SupabaseAuthGuard)
export class MinutesController {
  constructor(private readonly minutes: MinutesService) {}

  @Get("meeting/:meetingId")
  listByMeeting(
    @Req() req: AuthedRequest,
    @Param("meetingId", new ParseUUIDPipe()) meetingId: string,
  ) {
    return this.minutes.listByMeeting(req.accessToken, req.user.sub, meetingId);
  }

  @Post(":id/start-signing")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  startSigning(@Req() req: AuthedRequest, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.minutes.startSigning(req.accessToken, req.user.sub, id);
  }

  @Patch(":id/draft")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  updateDraft(
    @Req() req: AuthedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMinuteDraftDto,
  ) {
    return this.minutes.updateDraft(req.user.sub, id, dto);
  }

  @Get(":id")
  getOne(@Req() req: AuthedRequest, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.minutes.getById(req.accessToken, req.user.sub, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  create(@Req() req: AuthedRequest, @Body() dto: CreateMinuteDto) {
    return this.minutes.create(req.user.sub, dto);
  }
}

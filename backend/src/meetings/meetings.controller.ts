import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AddAttendeeDto } from "./dto/add-attendee.dto";
import { CreateMeetingDto } from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { MeetingsService } from "./meetings.service";

@Controller("meetings")
@UseGuards(SupabaseAuthGuard)
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.meetings.list(req.accessToken);
  }

  @Get(":id/attendees")
  attendees(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.meetings.listAttendees(req.accessToken, id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  update(@Req() req: AuthedRequest, @Param("id") id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetings.update(req.accessToken, req.user.sub, id, dto);
  }

  @Post(":id/attendees")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  addAttendee(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: AddAttendeeDto,
  ) {
    return this.meetings.addAttendee(req.accessToken, req.user.sub, id, dto);
  }

  @Delete(":id/attendees/:userId")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  removeAttendee(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.meetings.removeAttendee(req.accessToken, req.user.sub, id, userId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.meetings.remove(req.accessToken, req.user.sub, id);
  }

  @Get(":id")
  getOne(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.meetings.getById(req.accessToken, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  create(@Req() req: AuthedRequest, @Body() dto: CreateMeetingDto) {
    return this.meetings.create(req.accessToken, req.user.sub, dto);
  }
}

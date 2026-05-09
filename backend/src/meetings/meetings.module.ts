import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditModule } from "../audit/audit.module";
import { Meeting } from "../models/meeting.entity";
import { MeetingAttendee } from "../models/meeting-attendee.entity";
import { Minute } from "../models/minute.entity";
import { UsersModule } from "../users/users.module";
import { MeetingsController } from "./meetings.controller";
import { MeetingsService } from "./meetings.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, MeetingAttendee, Minute]),
    AuditModule,
    UsersModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditModule } from "../audit/audit.module";
import { Meeting } from "../models/meeting.entity";
import { MeetingAttendee } from "../models/meeting-attendee.entity";
import { Minute } from "../models/minute.entity";
import { MinutesController } from "./minutes.controller";
import { MinutesService } from "./minutes.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Minute, Meeting, MeetingAttendee]),
    AuditModule,
  ],
  controllers: [MinutesController],
  providers: [MinutesService],
  exports: [MinutesService],
})
export class MinutesModule {}

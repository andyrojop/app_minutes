import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { MeetingsModule } from "../meetings/meetings.module";
import { MinutesController } from "./minutes.controller";
import { MinutesService } from "./minutes.service";

@Module({
  imports: [AuditModule, MeetingsModule],
  controllers: [MinutesController],
  providers: [MinutesService],
})
export class MinutesModule {}

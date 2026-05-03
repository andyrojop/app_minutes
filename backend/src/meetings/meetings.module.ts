import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { UsersModule } from "../users/users.module";
import { MeetingsController } from "./meetings.controller";
import { MeetingsService } from "./meetings.service";

@Module({
  imports: [AuditModule, UsersModule],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}

import { Module } from "@nestjs/common";

import { AuditModule } from "./audit/audit.module";
import { CommitmentsModule } from "./commitments/commitments.module";
import { RolesGuard } from "./common/guards/roles.guard";
import { HealthModule } from "./health/health.module";
import { MeetingsModule } from "./meetings/meetings.module";
import { MinutesModule } from "./minutes/minutes.module";
import { ReportsModule } from "./reports/reports.module";
import { SignaturesModule } from "./signatures/signatures.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    HealthModule,
    MeetingsModule,
    MinutesModule,
    UsersModule,
    CommitmentsModule,
    AuditModule,
    ReportsModule,
    SignaturesModule,
  ],
  providers: [RolesGuard],
})
export class AppModule {}

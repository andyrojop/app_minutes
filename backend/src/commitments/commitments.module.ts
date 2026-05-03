import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { CommitmentsController } from "./commitments.controller";
import { CommitmentsService } from "./commitments.service";

@Module({
  imports: [AuditModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
  exports: [CommitmentsService],
})
export class CommitmentsModule {}

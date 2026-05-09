import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditModule } from "../audit/audit.module";
import { Commitment } from "../models/commitment.entity";
import { Minute } from "../models/minute.entity";
import { CommitmentsController } from "./commitments.controller";
import { CommitmentsService } from "./commitments.service";

@Module({
  imports: [TypeOrmModule.forFeature([Commitment, Minute]), AuditModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
  exports: [CommitmentsService],
})
export class CommitmentsModule {}

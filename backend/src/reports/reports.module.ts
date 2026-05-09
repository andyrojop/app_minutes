import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CommitmentsModule } from "../commitments/commitments.module";
import { Commitment } from "../models/commitment.entity";
import { Meeting } from "../models/meeting.entity";
import { Minute } from "../models/minute.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Minute, Commitment]), CommitmentsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

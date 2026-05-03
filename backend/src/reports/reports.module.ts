import { Module } from "@nestjs/common";

import { CommitmentsModule } from "../commitments/commitments.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [CommitmentsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

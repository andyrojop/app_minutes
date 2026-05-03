import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { SignaturesController } from "./signatures.controller";
import { SignaturesService } from "./signatures.service";

@Module({
  imports: [AuditModule],
  controllers: [SignaturesController],
  providers: [SignaturesService],
})
export class SignaturesModule {}

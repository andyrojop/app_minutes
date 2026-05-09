import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditModule } from "../audit/audit.module";
import { Signature } from "../models/signature.entity";
import { SignaturesController } from "./signatures.controller";
import { SignaturesService } from "./signatures.service";

@Module({
  imports: [TypeOrmModule.forFeature([Signature]), AuditModule],
  controllers: [SignaturesController],
  providers: [SignaturesService],
})
export class SignaturesModule {}

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditModule } from "./audit/audit.module";
import { CommitmentsModule } from "./commitments/commitments.module";
import { CommonModule } from "./common/common.module";
import { HealthModule } from "./health/health.module";
import { Attachment } from "./models/attachment.entity";
import { AuditLog } from "./models/audit-log.entity";
import { Commitment } from "./models/commitment.entity";
import { Meeting } from "./models/meeting.entity";
import { MeetingAttendee } from "./models/meeting-attendee.entity";
import { Minute } from "./models/minute.entity";
import { Signature } from "./models/signature.entity";
import { User } from "./models/user.entity";
import { MeetingsModule } from "./meetings/meetings.module";
import { MinutesModule } from "./minutes/minutes.module";
import { ReportsModule } from "./reports/reports.module";
import { SignaturesModule } from "./signatures/signatures.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get<string>("DATABASE_URL"),
        entities: [
          User,
          Meeting,
          MeetingAttendee,
          Minute,
          Commitment,
          Signature,
          Attachment,
          AuditLog,
        ],
        migrations: [__dirname + "/../database/migrations/*.js"],
        migrationsTableName: "migrations",
        migrationsRun: false,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    HealthModule,
    MeetingsModule,
    MinutesModule,
    UsersModule,
    CommitmentsModule,
    AuditModule,
    ReportsModule,
    SignaturesModule,
  ],
})
export class AppModule {}

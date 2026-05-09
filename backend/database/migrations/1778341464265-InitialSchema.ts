import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1778341464265 implements MigrationInterface {
    name = 'InitialSchema1778341464265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" text NOT NULL, "resource_type" text NOT NULL, "resource_id" uuid, "ip" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "actor_id" uuid, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_audit_log_actor" ON "audit_log" ("actor_id") `);
        await queryRunner.query(`CREATE INDEX "idx_audit_log_action" ON "audit_log" ("action") `);
        await queryRunner.query(`CREATE TYPE "public"."priority_enum" AS ENUM('alta', 'media', 'baja')`);
        await queryRunner.query(`CREATE TYPE "public"."commitment_status_enum" AS ENUM('pendiente', 'en_progreso', 'cumplido', 'vencido')`);
        await queryRunner.query(`CREATE TABLE "commitments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" text NOT NULL, "due_date" date, "priority" "public"."priority_enum" NOT NULL DEFAULT 'media', "status" "public"."commitment_status_enum" NOT NULL DEFAULT 'pendiente', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "minute_id" uuid NOT NULL, "assignee_id" uuid NOT NULL, CONSTRAINT "PK_82060edcfe810ce82b7565521af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_commitments_minute" ON "commitments" ("minute_id") `);
        await queryRunner.query(`CREATE INDEX "idx_commitments_assignee" ON "commitments" ("assignee_id") `);
        await queryRunner.query(`CREATE INDEX "idx_commitments_due_date" ON "commitments" ("due_date") `);
        await queryRunner.query(`CREATE INDEX "idx_commitments_status" ON "commitments" ("status") `);
        await queryRunner.query(`CREATE TABLE "meeting_attendees" ("meeting_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" text, "attended" boolean, CONSTRAINT "PK_fc6865479832a3f91764918a012" PRIMARY KEY ("meeting_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "idx_meeting_attendees_meeting" ON "meeting_attendees" ("meeting_id") `);
        await queryRunner.query(`CREATE INDEX "idx_meeting_attendees_user" ON "meeting_attendees" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."meeting_status_enum" AS ENUM('SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "meetings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "agenda" text, "location" text, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."meeting_status_enum" NOT NULL DEFAULT 'SCHEDULED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organizer_id" uuid NOT NULL, CONSTRAINT "PK_aa73be861afa77eb4ed31f3ed57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_meetings_scheduled_at" ON "meetings" ("scheduled_at") `);
        await queryRunner.query(`CREATE INDEX "idx_meetings_organizer" ON "meetings" ("organizer_id") `);
        await queryRunner.query(`CREATE INDEX "idx_meetings_status" ON "meetings" ("status") `);
        await queryRunner.query(`CREATE TABLE "signatures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "signature_svg" text, "signature_png" text, "metadata" jsonb, "signed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "minute_id" uuid NOT NULL, "signer_id" uuid NOT NULL, CONSTRAINT "PK_f56eb3cd344ce7f9ae28ce814eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_signatures_minute" ON "signatures" ("minute_id") `);
        await queryRunner.query(`CREATE INDEX "idx_signatures_signer" ON "signatures" ("signer_id") `);
        await queryRunner.query(`CREATE TYPE "public"."minute_status_enum" AS ENUM('DRAFT', 'SIGNING', 'SIGNED', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "minutes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" jsonb NOT NULL, "version" integer NOT NULL DEFAULT '1', "status" "public"."minute_status_enum" NOT NULL DEFAULT 'DRAFT', "content_hash" text, "signed_pdf_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "meeting_id" uuid NOT NULL, CONSTRAINT "PK_6430e69788e26236b493d6fcc7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_minutes_meeting" ON "minutes" ("meeting_id") `);
        await queryRunner.query(`CREATE INDEX "idx_minutes_status" ON "minutes" ("status") `);
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" text NOT NULL, "mime_type" text NOT NULL, "storage_key" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "minute_id" uuid NOT NULL, "uploaded_by" uuid NOT NULL, CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_attachments_minute" ON "attachments" ("minute_id") `);
        await queryRunner.query(`CREATE INDEX "idx_attachments_uploaded_by" ON "attachments" ("uploaded_by") `);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'secretary', 'auditor')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "email" text NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'secretary', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_15a6f5aad57db494c17986ed2e2" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commitments" ADD CONSTRAINT "FK_54bbc8ff066e5c9ea62928c966a" FOREIGN KEY ("minute_id") REFERENCES "minutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commitments" ADD CONSTRAINT "FK_9140a66fc9a807d5401a2143313" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meeting_attendees" ADD CONSTRAINT "FK_8643679c49d7234b266433bc201" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meeting_attendees" ADD CONSTRAINT "FK_edda203440a111ad016876f8737" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meetings" ADD CONSTRAINT "FK_51783596c43363cc8fe4b6e3f84" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signatures" ADD CONSTRAINT "FK_896952c6da180cbd3b4d0744caf" FOREIGN KEY ("minute_id") REFERENCES "minutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signatures" ADD CONSTRAINT "FK_3756743fa6af1eb364101368d7d" FOREIGN KEY ("signer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "minutes" ADD CONSTRAINT "FK_b5f85480864d8582430e488a93d" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_046b6629f2d139b3aebaadbd4a1" FOREIGN KEY ("minute_id") REFERENCES "minutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_e25812e3fd9b3f3edf11b2c5d58" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_e25812e3fd9b3f3edf11b2c5d58"`);
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_046b6629f2d139b3aebaadbd4a1"`);
        await queryRunner.query(`ALTER TABLE "minutes" DROP CONSTRAINT "FK_b5f85480864d8582430e488a93d"`);
        await queryRunner.query(`ALTER TABLE "signatures" DROP CONSTRAINT "FK_3756743fa6af1eb364101368d7d"`);
        await queryRunner.query(`ALTER TABLE "signatures" DROP CONSTRAINT "FK_896952c6da180cbd3b4d0744caf"`);
        await queryRunner.query(`ALTER TABLE "meetings" DROP CONSTRAINT "FK_51783596c43363cc8fe4b6e3f84"`);
        await queryRunner.query(`ALTER TABLE "meeting_attendees" DROP CONSTRAINT "FK_edda203440a111ad016876f8737"`);
        await queryRunner.query(`ALTER TABLE "meeting_attendees" DROP CONSTRAINT "FK_8643679c49d7234b266433bc201"`);
        await queryRunner.query(`ALTER TABLE "commitments" DROP CONSTRAINT "FK_9140a66fc9a807d5401a2143313"`);
        await queryRunner.query(`ALTER TABLE "commitments" DROP CONSTRAINT "FK_54bbc8ff066e5c9ea62928c966a"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_15a6f5aad57db494c17986ed2e2"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attachments_uploaded_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attachments_minute"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP INDEX "public"."idx_minutes_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_minutes_meeting"`);
        await queryRunner.query(`DROP TABLE "minutes"`);
        await queryRunner.query(`DROP TYPE "public"."minute_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_signatures_signer"`);
        await queryRunner.query(`DROP INDEX "public"."idx_signatures_minute"`);
        await queryRunner.query(`DROP TABLE "signatures"`);
        await queryRunner.query(`DROP INDEX "public"."idx_meetings_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_meetings_organizer"`);
        await queryRunner.query(`DROP INDEX "public"."idx_meetings_scheduled_at"`);
        await queryRunner.query(`DROP TABLE "meetings"`);
        await queryRunner.query(`DROP TYPE "public"."meeting_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_meeting_attendees_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_meeting_attendees_meeting"`);
        await queryRunner.query(`DROP TABLE "meeting_attendees"`);
        await queryRunner.query(`DROP INDEX "public"."idx_commitments_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_commitments_due_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_commitments_assignee"`);
        await queryRunner.query(`DROP INDEX "public"."idx_commitments_minute"`);
        await queryRunner.query(`DROP TABLE "commitments"`);
        await queryRunner.query(`DROP TYPE "public"."commitment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."priority_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_log_action"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_log_actor"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
    }

}

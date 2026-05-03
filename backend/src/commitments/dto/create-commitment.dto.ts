import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

const PRIORITIES = ["alta", "media", "baja"] as const;

export class CreateCommitmentDto {
  @IsUUID()
  minute_id!: string;

  @IsString()
  description!: string;

  @IsUUID()
  assignee_id!: string;

  @IsOptional()
  @IsDateString()
  due_date?: string | null;

  @IsOptional()
  @IsIn([...PRIORITIES])
  priority?: (typeof PRIORITIES)[number];
}

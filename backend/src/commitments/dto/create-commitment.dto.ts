import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

const PRIORITIES = ["alta", "media", "baja"] as const;

export class CreateCommitmentDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  minute_id!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  assignee_id!: string;

  @ApiPropertyOptional({ nullable: true, description: "ISO date YYYY-MM-DD" })
  @IsOptional()
  @IsDateString()
  due_date?: string | null;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn([...PRIORITIES])
  priority?: (typeof PRIORITIES)[number];
}

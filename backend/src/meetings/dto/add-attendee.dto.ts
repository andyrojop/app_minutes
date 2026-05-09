import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class AddAttendeeDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  user_id!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  role?: string | null;
}

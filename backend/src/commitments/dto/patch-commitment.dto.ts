import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

const STATUSES = ["pendiente", "en_progreso", "cumplido", "vencido"] as const;

export class PatchCommitmentDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn([...STATUSES])
  status?: (typeof STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

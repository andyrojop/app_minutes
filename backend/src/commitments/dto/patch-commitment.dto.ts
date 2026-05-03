import { IsIn, IsOptional, IsString } from "class-validator";

const STATUSES = ["pendiente", "en_progreso", "cumplido", "vencido"] as const;

export class PatchCommitmentDto {
  @IsOptional()
  @IsIn([...STATUSES])
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  description?: string;
}

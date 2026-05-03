import { IsOptional, IsString } from "class-validator";

export class UpdateMinuteDraftDto {
  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  desarrollo?: string;

  @IsOptional()
  @IsString()
  acuerdos?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

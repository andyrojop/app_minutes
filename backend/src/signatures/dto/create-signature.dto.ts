import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSignatureDto {
  @IsUUID()
  minute_id!: string;

  @IsOptional()
  @IsString()
  signature_svg?: string | null;

  @IsOptional()
  @IsString()
  signature_png?: string | null;
}

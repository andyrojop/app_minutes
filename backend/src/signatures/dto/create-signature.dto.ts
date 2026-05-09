import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSignatureDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  minute_id!: string;

  @ApiPropertyOptional({ nullable: true, description: "Trazo en SVG" })
  @IsOptional()
  @IsString()
  signature_svg?: string | null;

  @ApiPropertyOptional({ nullable: true, description: "Trazo en PNG base64 (300 DPI)" })
  @IsOptional()
  @IsString()
  signature_png?: string | null;
}

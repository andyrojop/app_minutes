import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMeetingDto {
  @ApiProperty({ example: "Reunión semanal" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  agenda?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "ISO o datetime-local; se normaliza a ISO en el servicio.",
  })
  @IsOptional()
  @IsString()
  scheduled_at?: string | null;
}

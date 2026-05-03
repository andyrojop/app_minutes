import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  agenda?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  /** Valor típico de `datetime-local`; se normaliza a ISO en el servicio. */
  @IsOptional()
  @IsString()
  scheduled_at?: string | null;
}

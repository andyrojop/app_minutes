import { IsOptional, IsString, IsUUID } from "class-validator";

export class AddAttendeeDto {
  @IsUUID()
  user_id!: string;

  @IsOptional()
  @IsString()
  role?: string | null;
}

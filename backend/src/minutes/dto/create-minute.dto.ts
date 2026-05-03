import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateMinuteDto {
  @IsUUID()
  @IsNotEmpty()
  meeting_id!: string;
}

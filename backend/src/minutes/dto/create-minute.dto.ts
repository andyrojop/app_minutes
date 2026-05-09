import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateMinuteDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  @IsNotEmpty()
  meeting_id!: string;
}

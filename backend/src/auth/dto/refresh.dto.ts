import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RefreshDto {
  @ApiProperty({ description: "Refresh token emitido en login o último refresh" })
  @IsString()
  refreshToken!: string;
}

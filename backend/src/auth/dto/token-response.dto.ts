import { ApiProperty } from "@nestjs/swagger";

import { TokenUserDto } from "./token-user.dto";

export class TokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: "Unix epoch (segundos) cuando expira el access token" })
  expiresAt!: number;

  @ApiProperty({ type: () => TokenUserDto })
  user!: TokenUserDto;
}

import { ApiProperty } from "@nestjs/swagger";

export class TokenUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ description: "Rol de la app: admin | secretary | auditor" })
  role!: string;
}

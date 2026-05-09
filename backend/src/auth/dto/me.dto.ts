import { ApiProperty } from "@nestjs/swagger";

export class MeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ description: "Rol: admin | secretary | auditor" })
  role!: string;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty({ description: "ISO timestamp" })
  created_at!: string;
}

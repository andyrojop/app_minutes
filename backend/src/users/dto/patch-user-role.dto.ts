import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional } from "class-validator";

const ROLES = ["admin", "secretary"] as const;

export class PatchUserRoleDto {
  @ApiProperty({ enum: ROLES })
  @IsIn([...ROLES])
  role!: (typeof ROLES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

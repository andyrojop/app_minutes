import { IsBoolean, IsIn, IsOptional } from "class-validator";

const ROLES = ["admin", "secretary"] as const;

export class PatchUserRoleDto {
  @IsIn([...ROLES])
  role!: (typeof ROLES)[number];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString, Matches, MinLength } from "class-validator";

const ROLES = ["admin", "secretary"] as const;

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      "Contraseña inicial (≥12 chars, mayúscula, minúscula, número y símbolo). El usuario puede cambiarla tras entrar.",
  })
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: "La contraseña debe incluir mayúscula, minúscula, número y símbolo.",
  })
  password!: string;

  @ApiProperty({ enum: ROLES })
  @IsIn([...ROLES])
  role!: (typeof ROLES)[number];
}

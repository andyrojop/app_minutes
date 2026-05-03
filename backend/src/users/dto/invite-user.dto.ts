import { IsEmail, IsIn, IsString, Matches, MinLength } from "class-validator";

const ROLES = ["admin", "secretary"] as const;

export class InviteUserDto {
  @IsEmail()
  email!: string;

  /** Contraseña inicial; el usuario puede cambiarla tras entrar. */
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: "La contraseña debe incluir mayúscula, minúscula, número y símbolo.",
  })
  password!: string;

  @IsIn([...ROLES])
  role!: (typeof ROLES)[number];
}

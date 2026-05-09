import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@demo.gt", description: "Email del usuario" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "MiPassword!2024", description: "Contraseña" })
  @IsString()
  @MinLength(8)
  password!: string;
}

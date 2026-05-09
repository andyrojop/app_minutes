/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InviteUserDto = {
  email: string;
  /**
   * Contraseña inicial (≥12 chars, mayúscula, minúscula, número y símbolo). El usuario puede cambiarla tras entrar.
   */
  password: string;
  role: InviteUserDto.role;
};
export namespace InviteUserDto {
  export enum role {
    ADMIN = 'admin',
    SECRETARY = 'secretary',
  }
}


/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TokenUserDto } from './TokenUserDto';
export type TokenResponseDto = {
  accessToken: string;
  refreshToken: string;
  /**
   * Unix epoch (segundos) cuando expira el access token
   */
  expiresAt: number;
  user: TokenUserDto;
};


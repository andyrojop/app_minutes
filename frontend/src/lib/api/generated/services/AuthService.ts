/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginDto } from '../models/LoginDto';
import type { MeDto } from '../models/MeDto';
import type { RefreshDto } from '../models/RefreshDto';
import type { TokenResponseDto } from '../models/TokenResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @param requestBody
   * @returns TokenResponseDto
   * @throws ApiError
   */
  public authControllerLogin(
    requestBody: LoginDto,
  ): CancelablePromise<TokenResponseDto> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/auth/login',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns TokenResponseDto
   * @throws ApiError
   */
  public authControllerRefresh(
    requestBody: RefreshDto,
  ): CancelablePromise<TokenResponseDto> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/auth/refresh',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns void
   * @throws ApiError
   */
  public authControllerLogout(
    requestBody: RefreshDto,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/auth/logout',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @returns MeDto
   * @throws ApiError
   */
  public authControllerMe(): CancelablePromise<MeDto> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/auth/me',
    });
  }
}

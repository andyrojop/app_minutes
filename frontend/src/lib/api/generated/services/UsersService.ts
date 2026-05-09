/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InviteUserDto } from '../models/InviteUserDto';
import type { PatchUserRoleDto } from '../models/PatchUserRoleDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UsersService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @returns any
   * @throws ApiError
   */
  public usersControllerMe(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/users/me',
    });
  }
  /**
   * @returns any
   * @throws ApiError
   */
  public usersControllerList(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/users',
    });
  }
  /**
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public usersControllerInvite(
    requestBody: InviteUserDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/users',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param id
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public usersControllerPatch(
    id: string,
    requestBody: PatchUserRoleDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/users/{id}',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateCommitmentDto } from '../models/CreateCommitmentDto';
import type { PatchCommitmentDto } from '../models/PatchCommitmentDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CommitmentsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @returns any
   * @throws ApiError
   */
  public commitmentsControllerListMine(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/commitments/me',
    });
  }
  /**
   * @param minuteId
   * @returns any
   * @throws ApiError
   */
  public commitmentsControllerList(
    minuteId: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/commitments',
      query: {
        'minute_id': minuteId,
      },
    });
  }
  /**
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public commitmentsControllerCreate(
    requestBody: CreateCommitmentDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/commitments',
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
  public commitmentsControllerPatch(
    id: string,
    requestBody: PatchCommitmentDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/commitments/{id}',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}

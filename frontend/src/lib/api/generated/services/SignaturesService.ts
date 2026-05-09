/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSignatureDto } from '../models/CreateSignatureDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SignaturesService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @param minuteId
   * @returns any
   * @throws ApiError
   */
  public signaturesControllerListByMinute(
    minuteId: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/signatures/minute/{minuteId}',
      path: {
        'minuteId': minuteId,
      },
    });
  }
  /**
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public signaturesControllerCreate(
    requestBody: CreateSignatureDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/signatures',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}

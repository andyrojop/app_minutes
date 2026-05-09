/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMinuteDto } from '../models/CreateMinuteDto';
import type { UpdateMinuteDraftDto } from '../models/UpdateMinuteDraftDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MinutesService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @param meetingId
   * @returns any
   * @throws ApiError
   */
  public minutesControllerListByMeeting(
    meetingId: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/minutes/meeting/{meetingId}',
      path: {
        'meetingId': meetingId,
      },
    });
  }
  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public minutesControllerStartSigning(
    id: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/minutes/{id}/start-signing',
      path: {
        'id': id,
      },
    });
  }
  /**
   * @param id
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public minutesControllerUpdateDraft(
    id: string,
    requestBody: UpdateMinuteDraftDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/minutes/{id}/draft',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public minutesControllerGetOne(
    id: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/minutes/{id}',
      path: {
        'id': id,
      },
    });
  }
  /**
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public minutesControllerCreate(
    requestBody: CreateMinuteDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/minutes',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}

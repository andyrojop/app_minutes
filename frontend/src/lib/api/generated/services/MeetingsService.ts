/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddAttendeeDto } from '../models/AddAttendeeDto';
import type { CreateMeetingDto } from '../models/CreateMeetingDto';
import type { UpdateMeetingDto } from '../models/UpdateMeetingDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MeetingsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @returns any
   * @throws ApiError
   */
  public meetingsControllerList(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/meetings',
    });
  }
  /**
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public meetingsControllerCreate(
    requestBody: CreateMeetingDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/meetings',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public meetingsControllerAttendees(
    id: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/meetings/{id}/attendees',
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
  public meetingsControllerAddAttendee(
    id: string,
    requestBody: AddAttendeeDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/meetings/{id}/attendees',
      path: {
        'id': id,
      },
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
  public meetingsControllerUpdate(
    id: string,
    requestBody: UpdateMeetingDto,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/meetings/{id}',
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
  public meetingsControllerRemove(
    id: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/meetings/{id}',
      path: {
        'id': id,
      },
    });
  }
  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public meetingsControllerGetOne(
    id: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/meetings/{id}',
      path: {
        'id': id,
      },
    });
  }
  /**
   * @param id
   * @param userId
   * @returns any
   * @throws ApiError
   */
  public meetingsControllerRemoveAttendee(
    id: string,
    userId: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/meetings/{id}/attendees/{userId}',
      path: {
        'id': id,
        'userId': userId,
      },
    });
  }
}

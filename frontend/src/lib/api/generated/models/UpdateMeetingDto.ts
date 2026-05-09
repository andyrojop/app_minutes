/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateMeetingDto = {
  title?: string;
  agenda?: Record<string, any> | null;
  location?: Record<string, any> | null;
  scheduled_at?: Record<string, any> | null;
  status?: UpdateMeetingDto.status;
};
export namespace UpdateMeetingDto {
  export enum status {
    SCHEDULED = 'SCHEDULED',
    ONGOING = 'ONGOING',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED',
  }
}


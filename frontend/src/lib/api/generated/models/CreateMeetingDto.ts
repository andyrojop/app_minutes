/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMeetingDto = {
  title: string;
  agenda?: Record<string, any> | null;
  location?: Record<string, any> | null;
  /**
   * ISO o datetime-local; se normaliza a ISO en el servicio.
   */
  scheduled_at?: Record<string, any> | null;
};


/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateCommitmentDto = {
  minute_id: string;
  description: string;
  assignee_id: string;
  /**
   * ISO date YYYY-MM-DD
   */
  due_date?: Record<string, any> | null;
  priority?: CreateCommitmentDto.priority;
};
export namespace CreateCommitmentDto {
  export enum priority {
    ALTA = 'alta',
    MEDIA = 'media',
    BAJA = 'baja',
  }
}


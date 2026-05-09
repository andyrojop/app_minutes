/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchCommitmentDto = {
  status?: PatchCommitmentDto.status;
  description?: string;
};
export namespace PatchCommitmentDto {
  export enum status {
    PENDIENTE = 'pendiente',
    EN_PROGRESO = 'en_progreso',
    CUMPLIDO = 'cumplido',
    VENCIDO = 'vencido',
  }
}


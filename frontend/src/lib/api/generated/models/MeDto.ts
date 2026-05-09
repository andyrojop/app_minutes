/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MeDto = {
  id: string;
  email: string;
  /**
   * Rol: admin | secretary | auditor
   */
  role: string;
  is_active: boolean;
  /**
   * ISO timestamp
   */
  created_at: string;
};


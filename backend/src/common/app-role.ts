/**
 * Roles en `public.users.role` (ERS):
 * - admin → Administrador: usuarios, configuración, auditoría, reportes ejecutivos; MFA TOTP obligatorio en API.
 * - secretary → Secretaria: reuniones, minutas, compromisos, firma, reportes operativos.
 */
export const APP_ROLE = {
  ADMIN: "admin",
  SECRETARY: "secretary",
} as const;

export type AppRole = (typeof APP_ROLE)[keyof typeof APP_ROLE];

/** ERS operativo: reuniones, minutas, compromisos y firma (admin o secretaría). */
export function canOperateAsSecretary(role: string | undefined | null): boolean {
  return role === APP_ROLE.ADMIN || role === APP_ROLE.SECRETARY;
}

/** Quién puede usar el flujo de captura de firma en API/servicios. */
export function isSignerLike(role: string | undefined | null): boolean {
  return role === APP_ROLE.ADMIN || role === APP_ROLE.SECRETARY;
}

/** Staff de registros (compromisos, etc.). */
export function canManageRecords(role: string | undefined | null): boolean {
  return canOperateAsSecretary(role);
}

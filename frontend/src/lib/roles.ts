/**
 * Valores en `public.users.role` (ERS).
 * - admin: usuarios, auditoría, reportes ejecutivos; también gestión operativa de reuniones/minutas/firma (MVP).
 * - secretary: reuniones, minutas, compromisos, flujo de firma, reportes operativos.
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  secretary: "Secretaria",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}

/** Alta/edición operativa ERS: reuniones, minutas, compromisos de equipo, convocados (admin o secretaría). */
export function canSecretaryOperate(role: string | null): boolean {
  return role === "secretary" || role === "admin";
}

/** Alias histórico: mismo criterio que `canSecretaryOperate`. */
export function canManageOrg(role: string | null): boolean {
  return canSecretaryOperate(role);
}

export function canManageUsers(role: string | null): boolean {
  return role === "admin";
}

/** Configuración del sistema (pantalla administrativa; mismo alcance que usuarios en el ERS). */
export function canManageSystemSettings(role: string | null): boolean {
  return role === "admin";
}

export function canViewReports(role: string | null): boolean {
  return role === "admin" || role === "secretary";
}

export function canViewAudit(role: string | null): boolean {
  return role === "admin";
}

export function canSign(role: string | null): boolean {
  return role === "secretary" || role === "admin";
}

/** Enlace «Compromisos» (panel global de seguimiento — solo staff). */
export function canSeeOrgCommitmentsNav(role: string | null): boolean {
  return canSecretaryOperate(role);
}

/** Enlace «Mis compromisos». */
export function canSeeMyCommitmentsNav(role: string | null): boolean {
  if (role == null) return true;
  return role === "admin" || role === "secretary";
}

export function canCreateMeeting(role: string | null): boolean {
  return role === "secretary" || role === "admin";
}

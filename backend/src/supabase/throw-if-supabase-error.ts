import { BadRequestException, ForbiddenException } from "@nestjs/common";

/** Convierte errores PostgREST/RLS en HTTP para que el frontend no reciba solo «Internal server error». */
export function throwIfSupabaseError(error: { message?: string; code?: string } | null): void {
  if (!error) return;
  const msg = error.message ?? "Error en la base de datos";
  if (/row-level security|violates row-level security policy|permission denied for table/i.test(msg)) {
    throw new ForbiddenException(
      "La base de datos rechazó la operación (RLS). Opciones: (1) En Supabase ejecuta las migraciones 005 y 006. (2) O en backend/.env define SUPABASE_SERVICE_ROLE_KEY (solo servidor; Settings → API en Supabase) para sincronizar usuarios sin depender de esas políticas.",
    );
  }
  throw new BadRequestException(msg);
}

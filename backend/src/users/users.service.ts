import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import type { InviteUserDto } from "./dto/invite-user.dto";
import type { PatchUserRoleDto } from "./dto/patch-user-role.dto";
import { AuditService } from "../audit/audit.service";
import { roleFromSupabaseUser } from "../common/resolve-request-role";
import {
  createUserScopedClient,
  tryCreateServiceRoleSupabaseClient,
} from "../supabase/supabase";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly audit: AuditService) {}

  async me(accessToken: string, userId: string) {
    const sb = createUserScopedClient(accessToken);

    const { data: authData, error: authErr } = await sb.auth.getUser();
    if (authErr || !authData?.user) {
      throw new Error(authErr?.message ?? "Sesión inválida");
    }
    const authUser = authData.user;

    let { data, error } = await sb
      .from("users")
      .select("id, email, role, is_active, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const metaRole = roleFromSupabaseUser(authUser);

    // Sin fila visible en SELECT (o fila aún no existe): upsert evita carrera y duplicate key (23505).
    // Políticas: INSERT propio (005) + UPDATE propio (`users_update_self`).
    if (!data) {
      const resolved = metaRole ?? "secretary";
      const row = {
        id: userId,
        email: authUser.email ?? "",
        role: resolved,
      };

      const admin = tryCreateServiceRoleSupabaseClient();

      const { error: jwtUpsertErr } = await sb.from("users").upsert(row, { onConflict: "id" });
      if (jwtUpsertErr) {
        this.logger.warn(`users.me bootstrap upsert (jwt): ${jwtUpsertErr.message}`);
        if (!admin) {
          this.logger.warn(
            "Sin SUPABASE_SERVICE_ROLE_KEY en backend/.env el servidor no puede escribir en public.users ni crear reuniones si RLS lo bloquea. Copia la clave «service_role» en Settings → API, reinicia el backend; o ejecuta la migración SQL 005 en Supabase.",
          );
        }
      }

      let refetch = await sb
        .from("users")
        .select("id, email, role, is_active, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (refetch.error) throw new Error(refetch.error.message);
      if (refetch.data) return refetch.data;

      if (admin) {
        const sr = await admin.from("users").upsert(row, { onConflict: "id" });
        if (sr.error) this.logger.warn(`users.me bootstrap upsert (service): ${sr.error.message}`);
        refetch = await sb
          .from("users")
          .select("id, email, role, is_active, created_at")
          .eq("id", userId)
          .maybeSingle();
        if (!refetch.error && refetch.data) return refetch.data;
        const svcRow = await admin
          .from("users")
          .select("id, email, role, is_active, created_at")
          .eq("id", userId)
          .maybeSingle();
        if (svcRow.data) return svcRow.data;
      }

      // RLS puede impedir SELECT pero la fila existe (p. ej. políticas desfasadas): no tumbar el perfil.
      this.logger.warn("users.me: sin lectura de fila tras upsert; respondiendo desde JWT/metadata.");
      return {
        id: userId,
        email: authUser.email ?? "",
        role: resolved,
        is_active: true,
        created_at: authUser.created_at ?? new Date().toISOString(),
      };
    }

    const roleMissing = !data.role || String(data.role).trim() === "";
    if (roleMissing) {
      const resolvedRole = metaRole ?? "secretary";
      let { error: upErr } = await sb.from("users").update({ role: resolvedRole }).eq("id", userId);
      if (upErr) {
        this.logger.warn(`users.me sync role (jwt): ${upErr.message}`);
        const admin = tryCreateServiceRoleSupabaseClient();
        if (admin) {
          const u2 = await admin.from("users").update({ role: resolvedRole }).eq("id", userId);
          if (u2.error) this.logger.warn(`users.me sync role (service): ${u2.error.message}`);
        }
      }

      let again = await sb
        .from("users")
        .select("id, email, role, is_active, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (!again.error && again.data) data = again.data;
      else {
        const svcRead = tryCreateServiceRoleSupabaseClient();
        if (svcRead) {
          again = await svcRead
            .from("users")
            .select("id, email, role, is_active, created_at")
            .eq("id", userId)
            .maybeSingle();
          if (again.data) data = again.data;
        }
      }
    }

    return data;
  }

  /**
   * Alta de usuario vía Supabase Admin (solo con service role).
   * Dispara `handle_new_user` → `public.users`; el upsert cubre carreras con el trigger.
   */
  async invite(accessToken: string, actorId: string, dto: InviteUserDto) {
    const svc = tryCreateServiceRoleSupabaseClient();
    if (!svc) {
      throw new BadRequestException(
        "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para crear usuarios.",
      );
    }

    const email = dto.email.trim().toLowerCase();

    const { data: created, error } = await svc.auth.admin.createUser({
      email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { app_role: dto.role },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const uid = created.user?.id;
    if (!uid) {
      throw new BadRequestException("No se obtuvo el identificador del usuario creado.");
    }

    const { error: syncErr } = await svc.from("users").upsert(
      { id: uid, email, role: dto.role },
      { onConflict: "id" },
    );
    if (syncErr) {
      this.logger.warn(`users.invite sync public.users: ${syncErr.message}`);
    }

    await this.audit.append(accessToken, actorId, {
      action: "user.invite",
      resource_type: "user",
      resource_id: uid,
    });

    return { id: uid, email };
  }

  async list(accessToken: string) {
    const sb = createUserScopedClient(accessToken);
    const { data, error } = await sb
      .from("users")
      .select("id, email, role, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async patch(accessToken: string, actorId: string, userId: string, dto: PatchUserRoleDto) {
    const sb = createUserScopedClient(accessToken);
    const patch: Record<string, unknown> = { role: dto.role };
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;

    const { data, error } = await sb.from("users").update(patch).eq("id", userId).select("id").maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException("Usuario no encontrado");

    await this.audit.append(accessToken, actorId, {
      action: "user.role_update",
      resource_type: "user",
      resource_id: userId,
    });

    return { ok: true };
  }
}

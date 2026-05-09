import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type { InviteUserDto } from "./dto/invite-user.dto";
import type { PatchUserRoleDto } from "./dto/patch-user-role.dto";
import { AuditService } from "../audit/audit.service";
import { roleFromSupabaseUser } from "../common/resolve-request-role";
import { User, UserRoleEnum } from "../models/user.entity";
import {
  createAnonSupabaseClient,
  tryCreateServiceRoleSupabaseClient,
} from "../supabase/supabase";

const USER_FIELDS = ["id", "email", "role", "isActive", "createdAt"] as const;

type UserDto = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

function toDto(u: User): UserDto {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    is_active: u.isActive,
    created_at: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  };
}

function asRoleEnum(value: string): UserRoleEnum {
  switch (value) {
    case UserRoleEnum.Admin:
    case UserRoleEnum.Secretary:
    case UserRoleEnum.Auditor:
      return value;
    default:
      return UserRoleEnum.Secretary;
  }
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  async me(accessToken: string, userId: string): Promise<UserDto> {
    // Lectura del JWT (Supabase Auth) para refrescar email + extraer rol del metadata.
    const anon = createAnonSupabaseClient();
    const { data: authData, error: authErr } = await anon.auth.getUser(accessToken);
    if (authErr || !authData?.user) {
      throw new Error(authErr?.message ?? "Sesión inválida");
    }
    const authUser = authData.user;
    const metaRole = roleFromSupabaseUser(authUser);

    const existing = await this.users.findOne({
      where: { id: userId },
      select: USER_FIELDS as unknown as (keyof User)[],
    });

    if (!existing) {
      // Bootstrap: crea fila si el trigger no llegó a sincronizarla aún.
      const resolved = asRoleEnum(metaRole ?? UserRoleEnum.Secretary);
      await this.users.upsert(
        { id: userId, email: authUser.email ?? "", role: resolved, isActive: true },
        ["id"],
      );
      const created = await this.users.findOne({
        where: { id: userId },
        select: USER_FIELDS as unknown as (keyof User)[],
      });
      if (created) return toDto(created);
      // Defensa final: responder desde JWT si la fila aún no es legible.
      this.logger.warn("users.me: fila no legible tras upsert; respondiendo desde JWT.");
      return {
        id: userId,
        email: authUser.email ?? "",
        role: resolved,
        is_active: true,
        created_at: authUser.created_at ?? new Date().toISOString(),
      };
    }

    const roleMissing = !existing.role || String(existing.role).trim() === "";
    if (roleMissing) {
      const resolved = asRoleEnum(metaRole ?? UserRoleEnum.Secretary);
      await this.users.update({ id: userId }, { role: resolved });
      const refreshed = await this.users.findOne({
        where: { id: userId },
        select: USER_FIELDS as unknown as (keyof User)[],
      });
      if (refreshed) return toDto(refreshed);
    }

    return toDto(existing);
  }

  /**
   * Alta de usuario vía Supabase Admin (solo con service role).
   * Dispara `handle_new_user` → `public.users`; el trigger crea la fila automáticamente.
   */
  async invite(actorId: string, dto: InviteUserDto) {
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

    // El trigger on_auth_user_created ya insertó la fila en public.users.
    // Solo aseguramos que el rol sea exactamente el solicitado (por si la metadata difiere).
    await this.users.upsert(
      { id: uid, email, role: asRoleEnum(dto.role), isActive: true },
      ["id"],
    );

    await this.audit.append(actorId, {
      action: "user.invite",
      resource_type: "user",
      resource_id: uid,
    });

    return { id: uid, email };
  }

  async list(): Promise<UserDto[]> {
    const rows = await this.users.find({
      order: { createdAt: "DESC" },
      select: USER_FIELDS as unknown as (keyof User)[],
    });
    return rows.map(toDto);
  }

  async patch(actorId: string, userId: string, dto: PatchUserRoleDto) {
    const patch: Partial<User> = { role: asRoleEnum(dto.role) };
    if (dto.is_active !== undefined) patch.isActive = dto.is_active;

    const result = await this.users.update({ id: userId }, patch);
    if (!result.affected) throw new NotFoundException("Usuario no encontrado");

    await this.audit.append(actorId, {
      action: "user.role_update",
      resource_type: "user",
      resource_id: userId,
    });

    return { ok: true };
  }
}

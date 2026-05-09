import {
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { roleFromSupabaseUser } from "../common/resolve-request-role";
import { User, UserRoleEnum } from "../models/user.entity";
import {
  createAnonSupabaseClient,
  tryCreateServiceRoleSupabaseClient,
} from "../supabase/supabase";
import type { LoginDto } from "./dto/login.dto";
import type { MeDto } from "./dto/me.dto";
import type { RefreshDto } from "./dto/refresh.dto";
import type { TokenResponseDto } from "./dto/token-response.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const sb = createAnonSupabaseClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
    });
    if (error || !data?.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? "Credenciales inválidas");
    }

    const role = await this.resolveRole(data.user.id, data.user);
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        role,
      },
    };
  }

  async refresh(dto: RefreshDto): Promise<TokenResponseDto> {
    const sb = createAnonSupabaseClient();
    const { data, error } = await sb.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });
    if (error || !data?.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? "Refresh token inválido");
    }

    const role = await this.resolveRole(data.user.id, data.user);
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        role,
      },
    };
  }

  /** Best-effort: revoca el refresh token del lado servidor. Siempre 204, no rompemos al cliente. */
  async logout(dto: RefreshDto): Promise<void> {
    try {
      const svc = tryCreateServiceRoleSupabaseClient();
      if (!svc) return;
      const { data: userData } = await svc.auth.getUser(dto.refreshToken).catch(() => ({
        data: { user: null },
      }));
      const userId = userData?.user?.id;
      if (userId) {
        await svc.auth.admin.signOut(userId).catch(() => undefined);
      }
    } catch (e) {
      this.logger.warn(`logout best-effort: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async me(userId: string): Promise<MeDto> {
    const row = await this.users.findOne({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!row) {
      throw new UnauthorizedException("Usuario no encontrado");
    }
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      is_active: row.isActive,
      created_at:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    };
  }

  /** Lee el rol de public.users; si falta, lo infiere del JWT user_metadata. */
  private async resolveRole(
    userId: string,
    supabaseUser: Parameters<typeof roleFromSupabaseUser>[0],
  ): Promise<string> {
    const row = await this.users.findOne({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (row?.role) return row.role;
    return roleFromSupabaseUser(supabaseUser) ?? UserRoleEnum.Secretary;
  }
}

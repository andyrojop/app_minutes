import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../models/user.entity";
import { createAnonSupabaseClient } from "../supabase/supabase";
import { APP_ROLE, type AppRole } from "./app-role";
import { normalizeStoredRole, roleFromSupabaseUser } from "./resolve-request-role";

/**
 * Resuelve el rol efectivo del usuario actual: BD primero (TypeORM),
 * fallback al user_metadata/app_metadata del JWT cuando aún no hay fila o el rol está vacío.
 * Mantiene la misma semántica que `resolveEffectiveAppRole` (función legacy) pero usa Repository<User>.
 */
@Injectable()
export class RoleResolverService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async resolve(accessToken: string, userId: string): Promise<AppRole | null> {
    const row = await this.users.findOne({
      where: { id: userId },
      select: { id: true, role: true },
    });

    let dbRolePresentButInvalid = false;
    if (row?.role != null && String(row.role).trim() !== "") {
      const fromDb = normalizeStoredRole(row.role);
      if (fromDb) return fromDb;
      dbRolePresentButInvalid = true;
    }

    const anon = createAnonSupabaseClient();
    const { data: authData, error: authErr } = await anon.auth.getUser(accessToken);
    if (authErr || !authData?.user) return null;
    if (authData.user.id !== userId) return null;

    const fromJwt = roleFromSupabaseUser(authData.user);
    if (fromJwt) return fromJwt;

    if (dbRolePresentButInvalid) return null;

    return APP_ROLE.SECRETARY;
  }
}

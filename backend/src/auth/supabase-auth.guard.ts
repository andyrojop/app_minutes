import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { createClient } from "@supabase/supabase-js";

import { APP_ROLE } from "../common/app-role";
import { RoleResolverService } from "../common/role-resolver.service";

export type RequestUser = { sub: string; email?: string };

export type AuthedRequest = Request & {
  accessToken: string;
  user: RequestUser;
};

function httpPath(req: Request): string {
  const r = req as Request & { originalUrl?: string };
  const raw = typeof r.originalUrl === "string" ? r.originalUrl : (req.url ?? "");
  const q = raw.indexOf("?");
  const path = q >= 0 ? raw.slice(0, q) : raw;
  return path.replace(/\/+$/, "") || "/";
}

/** Claims del access token ya validado con `getUser` (ERS: administradores exigen TOTP → `aal2`). */
function jwtAal(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    const o = JSON.parse(payload) as { aal?: string };
    return typeof o.aal === "string" ? o.aal : null;
  } catch {
    return null;
  }
}

/** Solo con `ADMIN_REQUIRE_AAL2=true` en entorno (activar cuando TOTP esté configurado en Supabase). */
function adminRequiresAal2Env(): boolean {
  return process.env.ADMIN_REQUIRE_AAL2?.trim() === "true";
}

/** Permite conocer el rol antes de exigir MFA (bootstrap del frontend). */
function isAdminMfaExempt(method: string, path: string): boolean {
  if (method !== "GET") return false;
  return path === "/api/users/me" || path === "/users/me";
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly roleResolver: RoleResolverService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Falta Authorization Bearer");
    }
    const token = header.slice("Bearer ".length).trim();

    const url = process.env.SUPABASE_URL?.trim();
    const anon = process.env.SUPABASE_ANON_KEY?.trim();
    if (!url || !anon) {
      throw new UnauthorizedException("SUPABASE_URL o SUPABASE_ANON_KEY no configurados en el servidor");
    }

    const sb = createClient(url, anon);
    try {
      const {
        data: { user },
        error,
      } = await sb.auth.getUser(token);

      if (error || !user) {
        const msg = error?.message?.toLowerCase() ?? "";
        const hint =
          msg.includes("expired") || msg.includes("expir")
            ? "Sesión expirada; cierra sesión y vuelve a entrar."
            : "Token inválido o expirado.";
        throw new UnauthorizedException(hint);
      }

      const path = httpPath(req);
      const method = (req.method ?? "GET").toUpperCase();
      if (adminRequiresAal2Env() && !isAdminMfaExempt(method, path)) {
        const role = await this.roleResolver.resolve(token, user.id);
        if (role === APP_ROLE.ADMIN && jwtAal(token) !== "aal2") {
          throw new ForbiddenException(
            "Los administradores deben completar la verificación en dos pasos (TOTP). Usa la pantalla de seguridad de la aplicación.",
          );
        }
      }

      req.accessToken = token;
      req.user = {
        sub: user.id,
        email: typeof user.email === "string" ? user.email : undefined,
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException("No se pudo validar la sesión con Supabase.");
    }
  }
}

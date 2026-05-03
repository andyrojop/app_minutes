import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthedRequest } from "../../auth/supabase-auth.guard";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AppRole } from "../app-role";
import { resolveEffectiveAppRole } from "../resolve-request-role";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const role = await resolveEffectiveAppRole(req.accessToken, req.user.sub);
    if (!role || !required.includes(role)) {
      throw new ForbiddenException(
        "No tienes permiso para esta acción. Comprueba tu rol en «Usuarios» (admin/secretary), que public.users esté sincronizado y reinicia el backend tras actualizar.",
      );
    }
    return true;
  }
}

import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";

import type { AuthedRequest } from "../auth/supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { APP_ROLE } from "../common/app-role";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { InviteUserDto } from "./dto/invite-user.dto";
import { PatchUserRoleDto } from "./dto/patch-user-role.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Definir antes de rutas parametrizadas genéricas. */
  @Get("me")
  me(@Req() req: AuthedRequest) {
    return this.users.me(req.accessToken, req.user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN, APP_ROLE.SECRETARY)
  list(@Req() req: AuthedRequest) {
    return this.users.list(req.accessToken);
  }

  /** Alta de cuenta: solo Administrador (ERS). Requiere MFA AAL2 si aplica. */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN)
  invite(@Req() req: AuthedRequest, @Body() dto: InviteUserDto) {
    return this.users.invite(req.accessToken, req.user.sub, dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(APP_ROLE.ADMIN)
  patch(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: PatchUserRoleDto,
  ) {
    return this.users.patch(req.accessToken, req.user.sub, id, dto);
  }
}

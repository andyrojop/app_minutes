import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { User } from "../models/user.entity";
import { RolesGuard } from "./guards/roles.guard";
import { RoleResolverService } from "./role-resolver.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [RoleResolverService, RolesGuard, SupabaseAuthGuard],
  exports: [RoleResolverService, RolesGuard, SupabaseAuthGuard],
})
export class CommonModule {}

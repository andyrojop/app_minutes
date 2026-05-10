import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMyProfile } from "@/actions/users";
import { getSession } from "@/lib/auth/get-session";
import { getMyRole } from "@/lib/session-role";
import {
  canManageSystemSettings,
  canManageUsers,
  canSecretaryOperate,
  canSeeMyCommitmentsNav,
  canViewAudit,
  canViewReports,
  roleLabel,
} from "@/lib/roles";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) return null;

  const profile = await getMyProfile();
  const role = await getMyRole();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Accesos según tu rol: administración (usuarios, auditoría, ajustes) o secretaría (reuniones, minutas,
          compromisos y firma).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cuenta</CardTitle>
            <CardDescription className="text-xs">Perfil de sesión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Correo </span>
              <span className="font-medium">{profile?.email ?? session.user.email ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Rol </span>
              <span className="font-medium">{roleLabel(role)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reuniones</CardTitle>
            <CardDescription className="text-xs">Convocatorias y minutas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/meetings" className={cn(buttonVariants())}>
              Ver reuniones
            </Link>
            {canSecretaryOperate(role) ? (
              <Link href="/meetings/new" className={cn(buttonVariants({ variant: "outline" }))}>
                Nueva reunión
              </Link>
            ) : null}
          </CardContent>
        </Card>

        {canSeeMyCommitmentsNav(role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Mis compromisos</CardTitle>
              <CardDescription>Tareas que te han asignado</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/my-commitments" className={cn(buttonVariants({ variant: "outline" }))}>
                Abrir lista
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {canSecretaryOperate(role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Compromisos del equipo</CardTitle>
              <CardDescription>Seguimiento global de acuerdos</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/commitments" className={cn(buttonVariants({ variant: "outline" }))}>
                Ver compromisos
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {canViewReports(role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
              <CardDescription>Indicadores agregados</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reports" className={cn(buttonVariants({ variant: "outline" }))}>
                Abrir tablero
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {canViewAudit(role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Auditoría</CardTitle>
              <CardDescription>Bitácora del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/audit" className={cn(buttonVariants({ variant: "outline" }))}>
                Ver registros
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {canManageSystemSettings(role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Sistema y seguridad (TOTP)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href="/settings" className={cn(buttonVariants({ variant: "outline" }))}>
                Abrir ajustes
              </Link>
              <Link href="/account/mfa" className={cn(buttonVariants({ variant: "outline" }))}>
                TOTP
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {canManageUsers(role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Roles y cuentas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/users" className={cn(buttonVariants({ variant: "outline" }))}>
                Administrar
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { inviteUserAction, listUsers, updateUserRoleAction } from "@/actions/users";
import { getMyRole } from "@/lib/session-role";
import { canManageUsers, roleLabel } from "@/lib/roles";
import type { UserRow } from "@/types/database";

const ROLES = ["admin", "secretary"] as const;

const PASSWORD_HINT =
  "Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo (contraseña inicial que el usuario puede cambiar).";

type Props = { searchParams?: Promise<{ invited?: string }> };

export default async function UsersAdminPage({ searchParams }: Props) {
  const role = await getMyRole();
  if (!canManageUsers(role)) redirect("/dashboard");

  const sp = searchParams ? await searchParams : {};

  let rows: UserRow[] = [];
  let err: string | null = null;
  try {
    rows = await listUsers();
  } catch (e) {
    err = e instanceof Error ? e.message : "Error";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground text-sm">
          Alta de cuentas y roles: solo <strong className="text-foreground font-medium">Administrador</strong>. La
          Secretaría puede ver el listado para convocados y compromisos, pero no crear usuarios.
        </p>
      </div>

      {sp.invited === "1" ? (
        <p className="rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-800 dark:text-green-400">
          Usuario creado correctamente. Ya puede iniciar sesión con el correo y la contraseña definidos.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
          <CardDescription>
            Requiere <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> en el backend. El correo quedará
            confirmado para poder entrar de inmediato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteUserAction} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Correo</Label>
              <Input id="invite-email" name="email" type="email" autoComplete="off" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Contraseña inicial</Label>
              <Input
                id="invite-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
              <p className="text-muted-foreground text-xs">{PASSWORD_HINT}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rol</Label>
              <select
                id="invite-role"
                name="role"
                defaultValue="secretary"
                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={cn(buttonVariants())}>
              Crear cuenta
            </button>
          </form>
        </CardContent>
      </Card>

      {err ? (
        <p className="text-destructive text-sm">{err}</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Actualizar rol de usuarios existentes.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Correo</th>
                  <th className="pb-2 pr-3 font-medium">Rol actual</th>
                  <th className="pb-2 font-medium">Cambiar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-3 pr-3 align-middle">{u.email ?? u.id}</td>
                    <td className="py-3 pr-3 align-middle">{roleLabel(u.role)}</td>
                    <td className="py-3 align-middle">
                      <form action={updateUserRoleAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="user_id" value={u.id} />
                        <Label htmlFor={`role-${u.id}`} className="sr-only">
                          Rol
                        </Label>
                        <select
                          id={`role-${u.id}`}
                          name="role"
                          defaultValue={String(u.role)}
                          className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                          Guardar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

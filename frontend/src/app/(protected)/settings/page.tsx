import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMyRole } from "@/lib/session-role";
import { canManageSystemSettings } from "@/lib/roles";

export default async function SettingsPage() {
  const role = await getMyRole();
  if (!canManageSystemSettings(role)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración del sistema</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Preferencias globales y seguridad para administradores (según perfil del ERS).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificación en dos pasos (TOTP)</CardTitle>
          <CardDescription>
            Activa MFA en Supabase (Authentication → Providers → MFA). Para exigir TOTP al entrar, pon{" "}
            <code className="text-xs">ADMIN_REQUIRE_AAL2=true</code> en frontend y backend (.env); si no está, el admin
            entra solo con contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/account/mfa" className={cn(buttonVariants({ variant: "outline" }))}>
            Gestionar TOTP
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Más ajustes</CardTitle>
          <CardDescription>
            Parámetros de negocio, integraciones y políticas se pueden enlazar aquí cuando existan tablas o APIs
            dedicadas.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

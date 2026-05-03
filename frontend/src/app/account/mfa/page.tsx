import { redirect } from "next/navigation";

import { MfaSetupForm } from "./mfa-setup-form";
import { getMyRole } from "@/lib/session-role";

export default async function AccountMfaPage() {
  const role = await getMyRole();
  if (role !== "admin") redirect("/dashboard");

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Verificación en dos pasos (TOTP)</h1>
        <p className="text-muted-foreground text-sm">
          Como administrador debes usar una app de autenticación (Google Authenticator, Microsoft Authenticator,
          etc.). Activa MFA en el proyecto Supabase si aún no está habilitado.
        </p>
      </div>
      <MfaSetupForm />
    </div>
  );
}

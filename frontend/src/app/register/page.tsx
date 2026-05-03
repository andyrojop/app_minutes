import { Suspense } from "react";
import { redirect } from "next/navigation";

import { isInviteOnlyMode } from "@/lib/env";

import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  if (isInviteOnlyMode()) {
    redirect("/login?notice=invite_only");
  }
  return (
    <Suspense fallback={<div className="text-muted-foreground p-8 text-center text-sm">Cargando…</div>}>
      <RegisterForm />
    </Suspense>
  );
}

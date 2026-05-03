import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-8 text-center text-sm">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isInviteOnlyMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { humanizeSupabaseAuthError } from "@/lib/supabase-auth-errors";
import { resolveSafePostLoginRedirect } from "@/lib/post-login-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveSafePostLoginRedirect(searchParams.get("next"));
  const inviteOnlyNotice = searchParams.get("notice") === "invite_only";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Next-Auth (para el cliente OpenAPI con Bearer token).
      const nextAuthResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!nextAuthResult || nextAuthResult.error) {
        setError(humanizeSupabaseAuthError(nextAuthResult?.error ?? "Credenciales inválidas"));
        return;
      }

      // 2. Supabase cookies SSR (para páginas/components que aún usan createClient).
      // Mientras se migra el frontend gradualmente, ambas sesiones conviven.
      const supabase = createClient();
      const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
      if (sbError) {
        // No bloqueamos el login: Next-Auth ya está activo. Solo log para debug.
        console.warn("[login] supabase signIn paralelo falló:", sbError.message);
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado al iniciar sesión.";
      setError(humanizeSupabaseAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  const showRegisterLink = !isInviteOnlyMode();

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center sm:text-left">
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          {inviteOnlyNotice ? (
            <p className="bg-muted/50 text-muted-foreground mb-4 rounded-lg border px-3 py-2 text-sm leading-relaxed">
              El autorregistro está cerrado. Las cuentas las crea un{" "}
              <span className="text-foreground font-medium">administrador</span> desde{" "}
              <span className="text-foreground font-medium">Usuarios</span> tras iniciar sesión. Si necesitas acceso,
              solicítalo al administrador.
            </p>
          ) : null}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className={cn(buttonVariants(), "w-full")}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
          {showRegisterLink ? (
            <p className="text-muted-foreground mt-4 text-center text-sm">
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Registrarse
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

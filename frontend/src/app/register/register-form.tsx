"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { humanizeSupabaseAuthError } from "@/lib/supabase-auth-errors";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signError) {
        setError(humanizeSupabaseAuthError(signError.message));
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setInfo(
        "Si tu proyecto exige confirmar el correo, revisa la bandeja de entrada. " +
          "Cuando confirmes, podrás iniciar sesión desde Iniciar sesión.",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado al registrarse.";
      setError(humanizeSupabaseAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center sm:text-left">
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-email">Correo</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contraseña</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password2">Repetir contraseña</Label>
              <Input
                id="reg-password2"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password2}
                onChange={(ev) => setPassword2(ev.target.value)}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {info ? <p className="text-muted-foreground text-sm">{info}</p> : null}
            <button type="submit" disabled={loading} className={cn(buttonVariants(), "w-full")}>
              {loading ? "Creando cuenta…" : "Registrarse"}
            </button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

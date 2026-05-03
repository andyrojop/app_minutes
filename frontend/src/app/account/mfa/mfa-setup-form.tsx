"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "verify";

export function MfaSetupForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifyFactorId, setVerifyFactorId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);

  const redirectIfAal2 = useCallback(async () => {
    const supabase = createClient();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") {
      router.replace("/dashboard");
      router.refresh();
      return true;
    }
    return false;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (await redirectIfAal2()) return;
      if (cancelled) return;

      const supabase = createClient();
      const { data: listed, error: listErr } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (listErr) {
        setError(listErr.message);
        setMode("enroll");
        setMessage("Si falla el listado de factores, confirma que MFA (TOTP) está activado en tu proyecto Supabase.");
        return;
      }

      const all = listed?.all ?? [];
      const verified = all.find(
        (f: { factor_type?: string; status?: string }) =>
          f.factor_type === "totp" && f.status === "verified",
      ) as { id: string } | undefined;

      if (verified?.id) {
        setVerifyFactorId(verified.id);
        setMode("verify");
        setMessage("Introduce el código de tu app de autenticación para elevar la sesión al nivel exigido.");
        return;
      }

      setMode("enroll");
      setMessage("Registra un factor TOTP: genera el QR, escanéalo en tu app y confirma con un código.");
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [redirectIfAal2]);

  async function startEnroll() {
    setError(null);
    const supabase = createClient();
    const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Administrador",
    });
    if (enrollErr) {
      setError(enrollErr.message);
      return;
    }
    const totp = data?.totp as { qr_code?: string; secret?: string } | undefined;
    if (totp?.qr_code) setQrDataUrl(totp.qr_code);
    if (totp?.secret) setSecret(totp.secret);
    if (data?.id) setPendingFactorId(data.id);
  }

  async function submitChallenge(factorId: string) {
    setError(null);
    const trimmed = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    const supabase = createClient();
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !ch?.id) {
      setError(chErr?.message ?? "No se pudo iniciar la verificación.");
      return;
    }

    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code: trimmed,
    });
    if (verErr) {
      setError(verErr.message);
      return;
    }

    setCode("");
    if (await redirectIfAal2()) return;

    const { data: listed } = await supabase.auth.mfa.listFactors();
    const verified = (listed?.all ?? []).find(
      (f: { factor_type?: string; status?: string; id?: string }) =>
        f.factor_type === "totp" && f.status === "verified",
    ) as { id: string } | undefined;

    if (verified?.id) {
      setPendingFactorId(null);
      setQrDataUrl(null);
      setSecret(null);
      setVerifyFactorId(verified.id);
      setMode("verify");
      setMessage("Introduce un nuevo código TOTP para completar el acceso.");
      return;
    }

    setError("El factor no quedó verificado. Intenta de nuevo o contacta soporte.");
  }

  if (mode === "loading") {
    return <p className="text-muted-foreground text-center text-sm">Cargando…</p>;
  }

  return (
    <div className="bg-card space-y-4 rounded-xl border p-6 shadow-sm">
      {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {mode === "enroll" ? (
        <div className="space-y-4">
          {!pendingFactorId ? (
            <button type="button" className={cn(buttonVariants(), "w-full")} onClick={() => void startEnroll()}>
              Generar código QR
            </button>
          ) : (
            <>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL desde Supabase MFA
                <img src={qrDataUrl} alt="QR TOTP" className="mx-auto max-w-[200px] rounded border bg-white p-2" />
              ) : null}
              {secret ? (
                <p className="text-muted-foreground font-mono break-all text-xs">
                  Secreto: <span className="text-foreground">{secret}</span>
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="code-enroll">Código de 6 dígitos</Label>
                <Input
                  id="code-enroll"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                />
              </div>
              <button
                type="button"
                className={cn(buttonVariants(), "w-full")}
                onClick={() => pendingFactorId && void submitChallenge(pendingFactorId)}
              >
                Confirmar registro
              </button>
            </>
          )}
        </div>
      ) : null}

      {mode === "verify" && verifyFactorId ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code-verify">Código TOTP</Label>
            <Input
              id="code-verify"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </div>
          <button
            type="button"
            className={cn(buttonVariants(), "w-full")}
            onClick={() => void submitChallenge(verifyFactorId)}
          >
            Verificar y continuar
          </button>
        </div>
      ) : null}
    </div>
  );
}

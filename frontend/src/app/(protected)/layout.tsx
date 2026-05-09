import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { adminRequiresAal2 } from "@/lib/env";
import { isJwtAal2 } from "@/lib/jwt-aal";
import { getMyRole } from "@/lib/session-role";
import { getSession } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Sesión Next-Auth (fuente de verdad para el guard).
  const session = await getSession();
  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/login");
  }

  // 2. Sesión Supabase (mientras conviven las dos auth para páginas no migradas).
  // Si Supabase no tiene cookie viva, los queries SSR con createClient devolverán anon.
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const email = session.user.email ?? supabaseUser?.email ?? null;
  const role = await getMyRole();

  if (role === "admin" && adminRequiresAal2()) {
    const accessToken = session.accessToken;
    if (!isJwtAal2(accessToken)) {
      redirect("/account/mfa");
    }
  }

  return (
    <div className="bg-muted/20 flex min-h-full flex-col">
      <AppHeader email={email} role={role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-5 sm:py-10">{children}</main>
    </div>
  );
}

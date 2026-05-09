"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  canManageSystemSettings,
  canManageUsers,
  canSeeMyCommitmentsNav,
  canSeeOrgCommitmentsNav,
  canViewAudit,
  canViewReports,
  roleLabel,
} from "@/lib/roles";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut } from "lucide-react";

type Props = {
  email: string | null;
  role: string | null;
};

function navActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AppHeader({ email, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    // Next-Auth dispara el evento `signOut` que llama a /auth/logout y limpia la sesión JWT.
    const { signOut } = await import("next-auth/react");
    // Logout paralelo de Supabase mientras conviven las dos sesiones.
    const supabase = createClient();
    await Promise.allSettled([supabase.auth.signOut(), signOut({ redirect: false })]);
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    cn(
      "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
      navActive(pathname, href)
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  return (
    <header className="border-border/80 bg-card/80 supports-[backdrop-filter]:bg-card/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <nav className="flex flex-wrap items-center gap-0.5 sm:gap-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Inicio
          </Link>
          <Link href="/meetings" className={linkClass("/meetings")}>
            Reuniones
          </Link>
          {canSeeOrgCommitmentsNav(role) ? (
            <Link href="/commitments" className={linkClass("/commitments")}>
              Compromisos
            </Link>
          ) : null}
          {canSeeMyCommitmentsNav(role) ? (
            <Link href="/my-commitments" className={linkClass("/my-commitments")}>
              Mis compromisos
            </Link>
          ) : null}
          {canViewReports(role) ? (
            <Link href="/reports" className={linkClass("/reports")}>
              Reportes
            </Link>
          ) : null}
          {canViewAudit(role) ? (
            <Link href="/audit" className={linkClass("/audit")}>
              Auditoría
            </Link>
          ) : null}
          {canManageSystemSettings(role) ? (
            <Link href="/settings" className={linkClass("/settings")}>
              Configuración
            </Link>
          ) : null}
          {canManageUsers(role) ? (
            <Link href="/users" className={linkClass("/users")}>
              Usuarios
            </Link>
          ) : null}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger
            suppressHydrationWarning
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "max-w-[280px] shrink-0 gap-1",
            )}
          >
            <span className="flex min-w-0 flex-col items-start text-left leading-tight">
              <span className="max-w-[220px] truncate text-xs font-normal text-muted-foreground">
                {roleLabel(role)}
              </span>
              <span className="max-w-[220px] truncate">{email ?? "Usuario"}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

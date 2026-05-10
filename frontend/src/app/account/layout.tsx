import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth/get-session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="bg-muted/30 flex min-h-full flex-col">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <span className="text-sm font-medium">Cuenta</span>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Inicio
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center px-4 py-10">{children}</div>
    </div>
  );
}

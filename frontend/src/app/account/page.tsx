import { redirect } from "next/navigation";

import { getMyRole } from "@/lib/session-role";

/** `/account` no tenía página; el middleware protege el prefijo y `?next=/account` tras login daba 404. */
export default async function AccountIndexPage() {
  const role = await getMyRole();
  if (role === "admin") redirect("/account/mfa");
  redirect("/dashboard");
}

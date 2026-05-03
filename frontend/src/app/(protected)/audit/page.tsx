import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { serverApiJson } from "@/lib/api/server-api";
import { getMyRole } from "@/lib/session-role";
import { canViewAudit } from "@/lib/roles";

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip: string | null;
  created_at: string;
};

export default async function AuditPage() {
  const role = await getMyRole();
  if (!canViewAudit(role)) redirect("/dashboard");

  let rows: AuditRow[] = [];
  let err: string | null = null;
  try {
    const data = await serverApiJson<AuditRow[]>("/audit-log");
    rows = Array.isArray(data) ? data : [];
  } catch (e) {
    err = e instanceof Error ? e.message : "Error";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground text-sm">
          Bitácora de acciones (solo lectura para Auditor y Administrador).
        </p>
      </div>

      {err ? (
        <p className="text-destructive text-sm">{err}</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Últimos registros</CardTitle>
            <CardDescription>Hasta 500 entradas recientes.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Cuándo</th>
                  <th className="pb-2 pr-2 font-medium">Acción</th>
                  <th className="pb-2 pr-2 font-medium">Recurso</th>
                  <th className="pb-2 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("es-GT")}
                    </td>
                    <td className="py-2 pr-2">{r.action ?? "—"}</td>
                    <td className="py-2 pr-2">
                      {(r.resource_type ?? "") +
                        (r.resource_id ? ` · ${r.resource_id.slice(0, 8)}…` : "")}
                    </td>
                    <td className="py-2 font-mono text-[11px]">{r.actor_id?.slice(0, 8) ?? "—"}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

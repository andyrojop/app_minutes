import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiConnectionHint } from "@/components/api-connection-hint";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_CONNECTION_FAILED_MESSAGE, serverApiJson } from "@/lib/api/server-api";
import { getMyRole } from "@/lib/session-role";
import { canSecretaryOperate } from "@/lib/roles";
import type { CommitmentRow } from "@/types/database";

export default async function CommitmentsPage() {
  const role = await getMyRole();
  if (!canSecretaryOperate(role)) redirect("/dashboard");
  let rows: CommitmentRow[] = [];
  let err: string | null = null;
  try {
    const data = await serverApiJson<CommitmentRow[]>("/commitments");
    rows = Array.isArray(data) ? data : [];
  } catch (e) {
    err = e instanceof Error ? e.message : "No se pudo cargar.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compromisos</h1>
        <p className="text-muted-foreground text-sm">Seguimiento de acuerdos y tareas.</p>
      </div>

      {err ? (
        <>
          <p className="text-destructive text-sm">{err}</p>
          {err === API_CONNECTION_FAILED_MESSAGE ? <ApiConnectionHint /> : null}
        </>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin compromisos</CardTitle>
            <CardDescription>Cuando existan, aparecerán aquí con prioridad y fecha límite.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Vista general del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Descripción</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 pr-3 font-medium">Prioridad</th>
                  <th className="pb-2 pr-3 font-medium">Vence</th>
                  <th className="pb-2 font-medium">Minuta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 align-top">{c.description ?? "—"}</td>
                    <td className="py-2 pr-3 align-top">
                      <Badge variant="secondary">{c.status ?? "—"}</Badge>
                    </td>
                    <td className="py-2 pr-3 align-top">{c.priority ?? "—"}</td>
                    <td className="py-2 pr-3 align-top whitespace-nowrap">
                      {c.due_date
                        ? new Date(c.due_date).toLocaleDateString("es-GT", {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </td>
                    <td className="py-2 align-top">
                      <Link href={`/minutes/${c.minute_id}`} className="text-primary underline-offset-4 hover:underline">
                        Ver minuta
                      </Link>
                    </td>
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

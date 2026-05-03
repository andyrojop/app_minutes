import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { patchCommitmentAction } from "@/app/(protected)/actions";
import { serverApiJson } from "@/lib/api/server-api";
import { getMyRole } from "@/lib/session-role";
import { canSeeMyCommitmentsNav } from "@/lib/roles";
import type { CommitmentRow } from "@/types/database";

const STATUSES = ["pendiente", "en_progreso", "cumplido", "vencido"] as const;

export default async function MyCommitmentsPage() {
  const role = await getMyRole();
  if (!canSeeMyCommitmentsNav(role)) redirect("/dashboard");
  let rows: CommitmentRow[] = [];
  let err: string | null = null;
  try {
    const data = await serverApiJson<CommitmentRow[]>("/commitments/me");
    rows = Array.isArray(data) ? data : [];
  } catch (e) {
    err = e instanceof Error ? e.message : "No se pudo cargar.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis compromisos</h1>
        <p className="text-muted-foreground text-sm">
          Actualiza el estado de lo que te han asignado.
        </p>
      </div>

      {err ? (
        <p className="text-destructive text-sm">{err}</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nada pendiente aquí</CardTitle>
            <CardDescription>Cuando seas responsable de un compromiso, aparecerá en esta lista.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-4">
          {rows.map((c) => (
            <li key={c.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">{c.description ?? "Compromiso"}</CardTitle>
                  <CardDescription>
                    Vence:{" "}
                    {c.due_date
                      ? new Date(c.due_date).toLocaleDateString("es-GT", { dateStyle: "long" })
                      : "Sin fecha"}
                    {c.priority ? ` · Prioridad: ${c.priority}` : null}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={patchCommitmentAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="commitment_id" value={c.id} />
                    <div className="space-y-1">
                      <Label htmlFor={`st-${c.id}`}>Estado</Label>
                      <select
                        id={`st-${c.id}`}
                        name="status"
                        defaultValue={c.status ?? "pendiente"}
                        className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                      Guardar
                    </button>
                  </form>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

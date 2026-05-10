import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReportsDashboard } from "@/actions/reports";
import { getMyRole } from "@/lib/session-role";
import { canViewReports } from "@/lib/roles";
import type { ReportsDashboard } from "@/types/database";

export default async function ReportsPage() {
  const role = await getMyRole();
  if (!canViewReports(role)) redirect("/dashboard");

  let data: ReportsDashboard | null = null;
  let err: string | null = null;
  try {
    data = await getReportsDashboard();
  } catch (e) {
    err = e instanceof Error ? e.message : "Error";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm">
          {role === "admin"
            ? "Reportes ejecutivos e indicadores agregados del sistema."
            : "Reportes operativos para seguimiento de reuniones, minutas y compromisos."}{" "}
          Las exportaciones PDF/Excel se pueden añadir después.
        </p>
      </div>

      {err ? (
        <p className="text-destructive text-sm">{err}</p>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Reuniones</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{data.totals.meetings}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Minutas</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{data.totals.minutes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Compromisos</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{data.totals.commitments}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="sm:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Compromisos por estado</CardTitle>
              <CardDescription>Distribución actual.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              {Object.entries(data.commitments_by_status).map(([k, v]) => (
                <span key={k} className="bg-muted rounded-full px-3 py-1">
                  <span className="font-medium">{k}</span>: {v}
                </span>
              ))}
              {Object.keys(data.commitments_by_status).length === 0 ? (
                <span className="text-muted-foreground">Sin datos.</span>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

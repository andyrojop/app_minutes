import Link from "next/link";

import { ApiConnectionHint } from "@/components/api-connection-hint";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listMeetings } from "@/actions/meetings";
import { API_CONNECTION_FAILED_MESSAGE } from "@/lib/api/errors";
import { getMyRole } from "@/lib/session-role";
import { canCreateMeeting } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { MeetingRow } from "@/types/database";

export default async function MeetingsPage() {
  const role = await getMyRole();
  let rows: MeetingRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await listMeetings();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "No se pudo cargar la lista.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reuniones</h1>
          <p className="text-muted-foreground">Programación y actas</p>
        </div>
        {canCreateMeeting(role) ? (
          <Link href="/meetings/new" className={cn(buttonVariants())}>
            Nueva reunión
          </Link>
        ) : null}
      </div>

      {loadError ? (
        <>
          <p className="text-destructive text-sm">{loadError}</p>
          {loadError === API_CONNECTION_FAILED_MESSAGE ? <ApiConnectionHint /> : null}
        </>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no hay reuniones</CardTitle>
            <CardDescription>Cuando crees una, aparecerá en esta lista.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id}>
              <Link href={`/meetings/${m.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold">{m.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {m.agenda || "Sin agenda"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{m.status}</Badge>
                  </CardHeader>
                  <CardContent className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {m.scheduled_at ? (
                      <span>
                        {new Date(m.scheduled_at).toLocaleString("es-GT", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    ) : (
                      <span>Sin fecha</span>
                    )}
                    {m.location ? <span>{m.location}</span> : null}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

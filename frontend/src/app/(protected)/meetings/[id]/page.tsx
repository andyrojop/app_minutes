import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  addMeetingAttendeeAction,
  cancelMeetingAction,
  deleteMeetingAction,
  getMeeting,
  listMeetingAttendees,
  removeMeetingAttendeeAction,
} from "@/actions/meetings";
import { createMinuteAction, listMinutesByMeeting } from "@/actions/minutes";
import { listUsers } from "@/actions/users";
import { getMyRole } from "@/lib/session-role";
import { canSecretaryOperate } from "@/lib/roles";
import type { MeetingRow, MinuteRow, UserRow } from "@/types/database";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<{ cancelada?: string }> };

export default async function MeetingDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const role = await getMyRole();

  let m!: MeetingRow;
  try {
    m = await getMeeting(id);
  } catch {
    notFound();
  }

  const staff = canSecretaryOperate(role);
  const canEdit = staff;

  let minuteRows: MinuteRow[] = [];
  try {
    minuteRows = await listMinutesByMeeting(id);
  } catch {
    minuteRows = [];
  }

  let attendees = await listMeetingAttendees(id).catch(() => []);

  let usersList: UserRow[] = [];
  if (staff) {
    usersList = await listUsers().catch(() => []);
  }

  const emailOf = (uid: string) => usersList.find((x) => x.id === uid)?.email ?? uid.slice(0, 8) + "…";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Link href="/meetings" className="hover:text-foreground underline-offset-4 hover:underline">
              Reuniones
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{m.title}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.title}</h1>
          <p className="text-muted-foreground max-w-2xl whitespace-pre-wrap">{m.agenda || "Sin agenda"}</p>
          <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
            {m.scheduled_at ? (
              <span>
                {new Date(m.scheduled_at).toLocaleString("es-GT", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </span>
            ) : null}
            {m.location ? <span>{m.location}</span> : null}
            <Badge variant="outline">{m.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Link href={`/meetings/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
              Editar
            </Link>
          ) : null}
          {staff ? (
            <form action={createMinuteAction}>
              <input type="hidden" name="meeting_id" value={id} />
              <button type="submit" className={cn(buttonVariants())}>
                Nueva minuta
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {sp.cancelada === "1" ? (
        <p className="border-border bg-muted/30 text-foreground rounded-xl border px-4 py-2.5 text-sm">
          Esta reunión está <strong>cancelada</strong>. Puedes seguir consultando minutas si las hay.
        </p>
      ) : null}

      {staff ? (
        <Card className="border-destructive/20 shadow-none">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Zona sensible</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Cancelar marca la reunión como terminada sin borrar datos. Eliminar borra el registro (puede fallar si hay
              minutas u otras referencias).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {m.status !== "CANCELLED" ? (
              <form action={cancelMeetingAction}>
                <input type="hidden" name="meeting_id" value={id} />
                <button type="submit" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Marcar como cancelada
                </button>
              </form>
            ) : null}
            <form action={deleteMeetingAction} className="inline">
              <input type="hidden" name="meeting_id" value={id} />
              <button type="submit" className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}>
                Eliminar reunión
              </button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Convocados</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lista</CardTitle>
            <CardDescription>Participantes vinculados a la reunión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendees.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin convocados aún.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {attendees.map((a) => (
                  <li key={a.user_id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 last:border-0">
                    <span>{staff ? emailOf(a.user_id) : a.user_id.slice(0, 8) + "…"}</span>
                    {staff ? (
                      <form action={removeMeetingAttendeeAction}>
                        <input type="hidden" name="meeting_id" value={id} />
                        <input type="hidden" name="user_id" value={a.user_id} />
                        <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                          Quitar
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {staff ? (
              <form action={addMeetingAttendeeAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
                <input type="hidden" name="meeting_id" value={id} />
                <div className="space-y-1">
                  <Label htmlFor="user_id">Añadir usuario</Label>
                  <select
                    id="user_id"
                    name="user_id"
                    required
                    className="border-input bg-background h-10 min-w-[220px] rounded-lg border px-3 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona…
                    </option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email ?? u.id.slice(0, 8) + "…"}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                  Añadir
                </button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Minutas</h2>
        {minuteRows.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin minutas</CardTitle>
              <CardDescription>Crea una minuta en borrador para documentar acuerdos.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="space-y-2">
            {minuteRows.map((min) => (
              <li key={min.id}>
                <Link href={`/minutes/${min.id}`}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Minuta · versión {min.version}
                      </CardTitle>
                      <Badge variant="secondary">{min.status}</Badge>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-xs">
                      Creada{" "}
                      {new Date(min.created_at).toLocaleString("es-GT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

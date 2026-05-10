import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMeeting, updateMeetingAction } from "@/actions/meetings";
import { getMyRole } from "@/lib/session-role";
import { canSecretaryOperate } from "@/lib/roles";
import type { MeetingRow } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

const STATUSES = ["SCHEDULED", "ONGOING", "FINISHED", "CANCELLED"] as const;

export default async function MeetingEditPage({ params }: Props) {
  const { id } = await params;
  const role = await getMyRole();

  let m!: MeetingRow;
  try {
    m = await getMeeting(id);
  } catch {
    notFound();
  }

  if (!canSecretaryOperate(role)) redirect(`/meetings/${id}`);

  const scheduledLocal = m.scheduled_at
    ? new Date(m.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Editar reunión</h1>
        <Link href={`/meetings/${id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
          <CardDescription>Cambia fecha, lugar, agenda o estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateMeetingAction} className="space-y-4">
            <input type="hidden" name="meeting_id" value={id} />
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required defaultValue={m.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <textarea
                id="agenda"
                name="agenda"
                rows={4}
                defaultValue={m.agenda ?? ""}
                className="border-input bg-background ring-ring/24 focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Fecha y hora</Label>
                <Input id="scheduled_at" name="scheduled_at" type="datetime-local" defaultValue={scheduledLocal} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lugar</Label>
                <Input id="location" name="location" defaultValue={m.location ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={m.status}
                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={cn(buttonVariants())}>
              Guardar cambios
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

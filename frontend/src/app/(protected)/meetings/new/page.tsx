import Link from "next/link";
import { redirect } from "next/navigation";

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
import { createMeetingAction } from "../../actions";
import { getMyRole } from "@/lib/session-role";
import { canCreateMeeting } from "@/lib/roles";

export default async function NewMeetingPage() {
  const role = await getMyRole();
  if (!canCreateMeeting(role)) redirect("/meetings");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Nueva reunión</h1>
        <Link href="/meetings" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
          <CardDescription>Título, agenda, fecha y lugar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createMeetingAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required placeholder="Junta de seguimiento" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <textarea
                id="agenda"
                name="agenda"
                rows={4}
                className="border-input bg-background ring-ring/24 focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Puntos a tratar..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Fecha y hora</Label>
                <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lugar</Label>
                <Input id="location" name="location" placeholder="Sala / enlace" />
              </div>
            </div>
            <button type="submit" className={cn(buttonVariants(), "w-full sm:w-auto")}>
              Guardar reunión
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

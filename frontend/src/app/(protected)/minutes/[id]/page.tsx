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
import { listCommitments, createCommitmentAction } from "@/actions/commitments";
import { getMeeting } from "@/actions/meetings";
import { getMinute, startMinuteSigningAction, updateMinuteDraftAction } from "@/actions/minutes";
import { listSignaturesByMinute } from "@/actions/signatures";
import { listUsers } from "@/actions/users";
import { SignaturesGallery } from "@/components/signature/signatures-gallery";
import { TopazSignatureForm } from "@/components/signature/topaz-signature-form";
import { getMyRole } from "@/lib/session-role";
import { canSecretaryOperate, canSign } from "@/lib/roles";
import type { MeetingRow, MinuteRow, UserRow } from "@/types/database";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ firma?: string }>;
};

export default async function MinuteEditorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const role = await getMyRole();
  const staff = canSecretaryOperate(role);
  const signerOk = canSign(role);

  let min!: MinuteRow;
  try {
    min = await getMinute(id);
  } catch {
    notFound();
  }

  const firmaJustStarted = sp.firma === "iniciada" && min.status === "SIGNING";

  let meet: MeetingRow | null = null;
  try {
    meet = await getMeeting(min.meeting_id);
  } catch {
    meet = null;
  }

  const commitments = await listCommitments(min.id).catch(() => []);
  const signatures = await listSignaturesByMinute(id).catch(() => []);

  let usersList: UserRow[] = [];
  if (staff) {
    usersList = await listUsers().catch(() => []);
  }

  const assigneeLabel = (uid: string | null) => {
    if (!uid) return "—";
    return usersList.find((x) => x.id === uid)?.email ?? `${uid.slice(0, 8)}…`;
  };

  const content = (min.content ?? {}) as Record<string, unknown>;
  const agenda = String(content.agenda ?? "");
  const desarrollo = String(content.desarrollo ?? "");
  const acuerdos = String(content.acuerdos ?? "");
  const observaciones = String(content.observaciones ?? "");

  /** Fuerza remount del formulario tras guardar (defaultValue solo aplica al montar). */
  const draftFormKey = `${min.id}:${JSON.stringify(min.content ?? {})}`;

  const fieldClass =
    "border-input bg-background ring-ring/24 focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  const readOnlyBlock = (
    <Card>
      <CardHeader>
        <CardTitle>Contenido del acta</CardTitle>
        <CardDescription>
          {min.status === "DRAFT"
            ? "Usa el formulario inferior para editar."
            : "Esta versión ya no se edita en borrador."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm whitespace-pre-wrap">
        <section>
          <h3 className="font-medium">Agenda</h3>
          <p className="text-muted-foreground">{agenda || "—"}</p>
        </section>
        <section>
          <h3 className="font-medium">Desarrollo</h3>
          <p className="text-muted-foreground">{desarrollo || "—"}</p>
        </section>
        <section>
          <h3 className="font-medium">Acuerdos</h3>
          <p className="text-muted-foreground">{acuerdos || "—"}</p>
        </section>
        <section>
          <h3 className="font-medium">Observaciones</h3>
          <p className="text-muted-foreground">{observaciones || "—"}</p>
        </section>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <Link href="/meetings" className="hover:text-foreground underline-offset-4 hover:underline">
            Reuniones
          </Link>
          {meet ? (
            <>
              <span>/</span>
              <Link
                href={`/meetings/${meet.id}`}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {meet.title}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="text-foreground font-medium">Minuta</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Minuta</h1>
          <Badge variant="outline">{min.status}</Badge>
        </div>
      </div>

      {firmaJustStarted ? (
        <div
          role="status"
          className="border-emerald-500/25 bg-emerald-500/[0.06] text-foreground rounded-xl border px-4 py-3 text-sm shadow-xs"
        >
          <p className="font-medium">Firma iniciada</p>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {signerOk
              ? "Usa «Registrar firma» más abajo (pad Topaz o SVG). El borrador quedó bloqueado."
              : "Tu cuenta no puede registrar firmas. Entra con administrador o secretaría."}
          </p>
        </div>
      ) : null}

      {min.status === "SIGNING" && !firmaJustStarted ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Documento en firma</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              El borrador está cerrado.{" "}
              {signerOk
                ? "Completa las firmas en la sección inferior."
                : "Solo administración o secretaría registran firmas aquí."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {staff && min.status === "DRAFT" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Flujo de firma</CardTitle>
              <CardDescription>
                Pasa la minuta a estado SIGNING: ya no podrás editar el borrador aquí y podrás registrar firmas (pad o
                SVG).
              </CardDescription>
            </div>
            <form action={startMinuteSigningAction}>
              <input type="hidden" name="minute_id" value={id} />
              <button type="submit" className={cn(buttonVariants({ variant: "secondary" }))}>
                Enviar a firma
              </button>
            </form>
          </CardHeader>
        </Card>
      ) : null}

      <SignaturesGallery signatures={signatures} />

      {min.status === "SIGNING" && signerOk ? (
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Registrar firma</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Pad Topaz (SigWeb) o pega un SVG. Las firmas confirmadas aparecen arriba.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TopazSignatureForm minuteId={id} fieldClass={fieldClass} />
          </CardContent>
        </Card>
      ) : null}

      {min.status !== "DRAFT" ? readOnlyBlock : null}

      {min.status === "DRAFT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar borrador</CardTitle>
            <CardDescription>Guarda cuando termines de escribir.</CardDescription>
          </CardHeader>
          <CardContent>
            <form key={draftFormKey} action={updateMinuteDraftAction} className="space-y-4">
              <input type="hidden" name="minute_id" value={id} />
              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda</Label>
                <textarea id="agenda" name="agenda" rows={4} defaultValue={agenda} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desarrollo">Desarrollo</Label>
                <textarea
                  id="desarrollo"
                  name="desarrollo"
                  rows={6}
                  defaultValue={desarrollo}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acuerdos">Acuerdos</Label>
                <textarea id="acuerdos" name="acuerdos" rows={4} defaultValue={acuerdos} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={3}
                  defaultValue={observaciones}
                  className={fieldClass}
                />
              </div>
              <button type="submit" className={cn(buttonVariants())}>
                Guardar borrador
              </button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Compromisos</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {commitments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin compromisos ligados a esta minuta.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {commitments.map((c) => (
                  <li key={c.id} className="border-b border-border/50 pb-2 last:border-0">
                    <span className="font-medium">{c.description ?? "—"}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {c.status ?? "—"} · Responsable: {assigneeLabel(c.assignee_id)}
                      {c.due_date
                        ? ` · Vence ${new Date(c.due_date).toLocaleDateString("es-GT")}`
                        : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {staff ? (
              <form action={createCommitmentAction} className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                <input type="hidden" name="minute_id" value={id} />
                {usersList.length === 0 ? (
                  <p className="text-muted-foreground sm:col-span-2 text-sm">
                    No hay usuarios en el sistema para asignar. Ve a <strong>Usuarios</strong> e invita cuentas, o en la
                    raíz del repo ejecuta <code className="bg-muted rounded px-1">npm run seed:assignees</code> (requiere{" "}
                    <code className="bg-muted rounded px-1">SUPABASE_SERVICE_ROLE_KEY</code> en{" "}
                    <code className="bg-muted rounded px-1">backend/.env</code>).
                  </p>
                ) : null}
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <textarea id="description" name="description" required rows={2} className={fieldClass} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="assignee_id">Responsable</Label>
                  <select
                    id="assignee_id"
                    name="assignee_id"
                    required={usersList.length > 0}
                    disabled={usersList.length === 0}
                    className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona…
                    </option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email ?? u.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="due_date">Fecha límite</Label>
                  <input id="due_date" name="due_date" type="date" className={fieldClass} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="priority">Prioridad</Label>
                  <select id="priority" name="priority" className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm">
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Añadir compromiso
                  </button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

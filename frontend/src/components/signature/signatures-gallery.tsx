import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SignatureRow } from "@/types/database";

type Props = {
  signatures: SignatureRow[];
};

function isLikelySvg(s: string | null): boolean {
  if (!s || typeof s !== "string") return false;
  const t = s.trim().toLowerCase();
  return t.startsWith("<svg") || t.includes("<svg");
}

export function SignaturesGallery({ signatures }: Props) {
  if (signatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Firmas registradas</CardTitle>
          <CardDescription>Aún no hay firmas guardadas para esta minuta.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Firmas registradas</CardTitle>
        <CardDescription>
          {signatures.length} {signatures.length === 1 ? "firma" : "firmas"} en orden cronológico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signatures.map((sig, index) => {
            const label =
              sig.signer_email?.trim() ||
              (sig.signer_id ? `${sig.signer_id.slice(0, 8)}…` : "Firmante");
            const when = sig.signed_at
              ? new Date(sig.signed_at).toLocaleString("es-GT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "—";
            const raw = sig.signature_svg?.trim() ?? "";
            const showSvg = isLikelySvg(raw);

            return (
              <div
                key={sig.id}
                className="border-border flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs"
              >
                <div className="bg-muted/50 flex items-center justify-between gap-2 border-b px-3 py-2 text-xs">
                  <span className="text-foreground font-medium">#{index + 1}</span>
                  <span className="text-muted-foreground max-w-[55%] truncate" title={label}>
                    {label}
                  </span>
                </div>
                <div className="text-muted-foreground px-3 py-1 text-[11px]">{when}</div>
                <div className="bg-white p-2">
                  {showSvg ? (
                    <div
                      className="flex min-h-[120px] max-h-[200px] items-center justify-center overflow-auto [&_svg]:max-h-[180px] [&_svg]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: raw }}
                    />
                  ) : (
                    <p className="text-muted-foreground text-center text-xs">Sin vista previa de trazo</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

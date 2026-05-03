export function ApiConnectionHint() {
  return (
    <div className="border-destructive/40 bg-destructive/5 text-muted-foreground mt-4 rounded-lg border p-4 text-sm">
      <p className="text-destructive font-medium">Cómo solucionarlo</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>
          Arranca el API NestJS: en la carpeta del proyecto ejecuta{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">npm run dev:all</code>{" "}
          (frontend + backend) o solo{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">npm run dev:backend</code>.
        </li>
        <li>
          En <code className="bg-muted rounded px-1 py-0.5 text-xs">frontend/.env</code> o{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">frontend/.env.local</code>, define{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">NEXT_PUBLIC_API_URL=http://localhost:3001</code>
          .
        </li>
        <li>
          En <code className="bg-muted rounded px-1 py-0.5 text-xs">backend/.env</code> completa{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">SUPABASE_URL</code> y{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">SUPABASE_ANON_KEY</code> (misma clave
          publicable o anon que en el frontend). El API valida tu sesión contra Supabase con esa clave.
        </li>
        <li>
          Prueba en el navegador{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">http://localhost:3001/api/health</code>: debe
          responder <code className="bg-muted rounded px-1 py-0.5 text-xs">{`{"status":"ok"}`}</code>.
        </li>
      </ul>
    </div>
  );
}

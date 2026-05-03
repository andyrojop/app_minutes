/**
 * Crea 2 usuarios de prueba (Auth + public.users) para usar como responsables en compromisos.
 * Requiere backend/.env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: npm run seed:assignees
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([\w.-]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv(resolve(root, "backend/.env"));

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en backend/.env");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO = [
  { email: "demo.responsable1@local.test", password: "DemoResponsable1!", role: "secretary" },
  { email: "demo.responsable2@local.test", password: "DemoResponsable2!", role: "secretary" },
];

async function upsertUser(row) {
  const { email, password, role } = row;
  const { data: existing, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error("[auth] listUsers", listErr.message);
    process.exit(1);
  }
  const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  let userId = found?.id;

  if (!userId) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { app_role: role },
    });
    if (error) {
      console.error("[auth] createUser", email, error.message);
      return;
    }
    userId = data.user?.id;
    console.log("[auth] creado", email, userId);
  } else {
    console.log("[auth] ya existe", email, userId);
  }

  if (!userId) return;

  const { error: upErr } = await sb.from("users").upsert(
    { id: userId, email, role, is_active: true },
    { onConflict: "id" },
  );
  if (upErr) console.warn("[users] upsert", email, upErr.message);
  else console.log("[users] fila public.users", email);
}

async function main() {
  for (const row of DEMO) {
    await upsertUser(row);
  }
  console.log("\nListo. Recarga la minuta: el desplegable «Responsable» debería mostrar los dos correos demo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

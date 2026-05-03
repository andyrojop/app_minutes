/**
 * Borra filas en public.users y todas las cuentas en auth.users (vía Admin API).
 * Requiere en backend/.env (o proceso): SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: node scripts/supabase-admin-reset.mjs
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
loadDotEnv(resolve(root, "frontend/.env"));

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error(`
[Falta configuración]

Define en backend/.env:
  SUPABASE_URL=https://tu-proyecto.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<clave service_role del dashboard → Settings → API>

(Esa clave es secreta; no la subas a Git.)
`);
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteAllPublicUsers() {
  const { data: rows, error: selErr } = await sb.from("users").select("id");
  if (selErr) {
    console.warn("[users] select:", selErr.message);
    return;
  }
  const ids = rows ?? [];
  for (const r of ids) {
    const { error } = await sb.from("users").delete().eq("id", r.id);
    if (error) console.warn("[users] delete", r.id, error.message);
    else console.log("[users] eliminado", r.id);
  }
  if (ids.length === 0) console.log("[users] tabla ya vacía o sin lectura.");
}

async function deleteAllAuthUsers() {
  let page = 1;
  const perPage = 100;
  let total = 0;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[auth] listUsers:", error.message);
      process.exit(1);
    }
    const batch = data?.users ?? [];
    if (batch.length === 0) break;
    for (const u of batch) {
      const { error: delErr } = await sb.auth.admin.deleteUser(u.id);
      if (delErr) console.warn("[auth] delete", u.email ?? u.id, delErr.message);
      else {
        console.log("[auth] eliminado", u.email ?? u.id);
        total += 1;
      }
    }
    if (batch.length < perPage) break;
    page += 1;
  }
  console.log(`[auth] total eliminados: ${total}`);
}

console.log("--- Reset Supabase (public.users + auth.users) ---\n");
await deleteAllPublicUsers();
await deleteAllAuthUsers();
console.log("\n--- Listo. Ejecuta luego el SQL 004 en el Editor si hace falta recrear el trigger. ---");

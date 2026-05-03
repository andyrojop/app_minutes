# Gestión de minutas (MVP)

Monorepo con **frontend** (Next.js + Supabase Auth + shadcn/ui) y **backend** (NestJS + Supabase con JWT del usuario para respetar RLS).

## Requisitos

- Node.js 20+
- Proyecto Supabase con tu DDL y `supabase/migrations/001_rls_policies_and_triggers.sql`.

## Instalación (una vez)

En la raíz del repo:

```bash
cd app_minutes
npm install --legacy-peer-deps
```

## Variables de entorno

1. **Frontend** — copia `frontend/.env.example` → `frontend/.env.local` y completa URL/claves de Supabase y la URL del API:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - `NEXT_PUBLIC_API_URL=http://localhost:3001`

2. **Backend** — copia `backend/.env.example` → `backend/.env`:

   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (iguales al frontend; la sesión se valida con `auth.getUser` en Supabase)
   - `FRONTEND_ORIGIN=http://localhost:3000`
   - `PORT=3001` (opcional)

Sin estas variables verás errores al iniciar sesión, al llamar al API o al validar tokens.

## Comandos para levantar el proyecto

**Dos terminales** (recomendado la primera vez para ver logs por separado):

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

**Un solo comando** (backend + frontend a la vez):

```bash
npm run dev:all
```

**Comprobar compilación y ESLint:**

```bash
npm run verify
```

**Vaciar cuentas de prueba en tu proyecto Supabase** (requiere `SUPABASE_SERVICE_ROLE_KEY` en `backend/.env`; solo uso local):

```bash
npm run supabase:cleanup
```

- Web: [http://localhost:3000](http://localhost:3000) — rutas `/login` y **`/register`**.
- API: [http://localhost:3001/api/health](http://localhost:3001/api/health).

## Registro de usuarios

- En la app: página **`/register`** (contraseña fuerte: ≥12 caracteres, mayúscula, minúscula, número y símbolo).
- En Supabase: **Authentication → Providers → Email** debe permitir **sign-ups** si quieres que el formulario cree cuentas nuevas.
- Tras el alta, el trigger del SQL crea la fila en `public.users`. **Solo `secretary`** crea reuniones y minutas; **`admin`** gestiona usuarios y auditoría. Asigna rol en el SQL Editor si hace falta:

```sql
update public.users set role = 'secretary' where email = 'tu@correo.com';
```

Si tu proyecto tiene **confirmación por correo** activada, tras registrarte puede que debas abrir el enlace del email antes de poder iniciar sesión.

### Mensaje de límite de registro / correo (“rate limit”, “email rate limit exceeded”)

Es una protección de **Supabase Auth** al disparar muchos registros o correos de confirmación.

1. **Authentication → Providers → Email**: desactiva **Confirm email** mientras desarrollas (así no se envía correo en cada alta).
2. **Authentication**: revisa **Rate Limits** (nombre puede variar según el dashboard) y súbelos si está disponible en tu plan.
3. Espera unos minutos o usa otro correo; subir a **Pro** aumenta cuotas pero no suele ser necesario solo para pruebas.

## Migraciones SQL

1. Ejecuta tu script de tablas (extensiones, `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`). La tabla **`public.users`** debe tener al menos **`id` (uuid, PK, igual que `auth.users.id`)**, **`email`** y **`role`** (texto).
2. Ejecuta `supabase/migrations/001_rls_policies_and_triggers.sql`.
3. Recomendado: `002_user_role_from_signup_metadata.sql` (rol al registrarse), `003_secretary_operational_writes_only.sql` (RLS admin vs secretaría).
4. **Si `public.users` está vacío pero en Authentication sí hay usuarios**, ejecuta **`004_ensure_public_users_from_auth.sql`** en el SQL Editor: recrea el trigger `on_auth_user_created`, intenta dejar la función en owner `postgres` (para que el INSERT no lo bloquee RLS) y **copia las cuentas ya existentes** desde `auth.users`.

## Build producción

```bash
npm run build
```

## Notas

- El backend comprueba el access token con Supabase Auth y usa la anon key con el token del usuario; las políticas RLS siguen aplicando.
- Agente Electron / pad Topaz: fase posterior según tu ERS.

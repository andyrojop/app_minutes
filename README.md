# Sistema de Gestión de Minutas

Aplicación web para la **gestión integral de reuniones, minutas y compromisos**, con control de acceso por roles, trazabilidad y firma electrónica. Implementada como un monorepo con frontend en Next.js, API en NestJS y persistencia en Supabase (PostgreSQL) con políticas de Row Level Security (RLS).

> Estado actual: **MVP funcional**. Cubre el flujo end-to-end de creación de reuniones, levantamiento de minutas, asignación de compromisos, reportes y auditoría.

---

## Tabla de contenidos

1. [Características](#características)
2. [Arquitectura](#arquitectura)
3. [Stack tecnológico](#stack-tecnológico)
4. [Estructura del repositorio](#estructura-del-repositorio)
5. [Requisitos previos](#requisitos-previos)
6. [Instalación](#instalación)
7. [Configuración de entornos](#configuración-de-entornos)
8. [Migraciones de base de datos](#migraciones-de-base-de-datos)
9. [Ejecución en desarrollo](#ejecución-en-desarrollo)
10. [Roles y permisos](#roles-y-permisos)
11. [Registro y alta de usuarios](#registro-y-alta-de-usuarios)
12. [Scripts disponibles](#scripts-disponibles)
13. [Build de producción](#build-de-producción)
14. [Solución de problemas](#solución-de-problemas)
15. [Notas y trabajo futuro](#notas-y-trabajo-futuro)

---

## Características

- **Autenticación** con Supabase Auth (correo y contraseña, política de contraseña fuerte).
- **Control de acceso basado en roles** (`admin`, `secretary`, usuario estándar) reforzado tanto en la API como en la base de datos mediante RLS.
- **Gestión de reuniones**: alta, edición, listado y consulta de detalle.
- **Levantamiento de minutas** asociadas a cada reunión.
- **Compromisos**: asignación a responsables, seguimiento y vista personal "Mis compromisos".
- **Reportes** y **auditoría** de operaciones sensibles.
- **Firma electrónica** con soporte opcional para pad Topaz (SigWeb) en estaciones Windows.
- **Soporte de MFA (AAL2)** opcional para administradores.
- **Modo invite-only** opcional para entornos productivos (deshabilita el registro público).

---

## Arquitectura

```
┌──────────────────┐         HTTPS / JWT          ┌──────────────────┐
│   Frontend       │ ───────────────────────────▶ │   Backend API    │
│   Next.js 16     │                              │   NestJS 11      │
│   (App Router)   │ ◀─────────────────────────── │   (REST)         │
└────────┬─────────┘                              └────────┬─────────┘
         │ Supabase JS (Auth + SSR)                        │ Supabase JS (anon + JWT del usuario)
         ▼                                                 ▼
              ┌──────────────────────────────────────────┐
              │  Supabase (PostgreSQL + Auth + RLS)      │
              │  - Tablas de dominio                     │
              │  - Políticas RLS por rol                 │
              │  - Triggers de aprovisionamiento         │
              └──────────────────────────────────────────┘
```

- El **frontend** mantiene la sesión del usuario a través de cookies SSR (`@supabase/ssr`) y consume tanto la API NestJS como Supabase directamente para lecturas públicas.
- El **backend** valida cada `Bearer token` con `auth.getUser()` y propaga el JWT del usuario hacia Supabase para que las **políticas RLS** se evalúen con su identidad real.
- La **base de datos** centraliza la autorización fina mediante RLS, garantizando que la API no pueda escapar a los permisos del usuario autenticado.

---

## Stack tecnológico

### Frontend (`/frontend`)

| Tecnología                     | Versión |
| ------------------------------ | ------- |
| Next.js (App Router)           | 16.2    |
| React                          | 19.2    |
| Tailwind CSS                   | 4.x     |
| shadcn/ui + Base UI            | última  |
| @supabase/ssr / supabase-js    | 0.10 / 2.105 |
| TypeScript                     | 5.x     |

### Backend (`/backend`)

| Tecnología                     | Versión |
| ------------------------------ | ------- |
| NestJS                         | 11.1    |
| @supabase/supabase-js          | 2.105   |
| class-validator / class-transformer | última |
| TypeScript                     | 5.9     |

### Infraestructura

- **Supabase** (PostgreSQL gestionado, Auth, RLS).
- **Node.js 20 LTS** o superior.
- Workspaces de **npm** (`frontend` + `backend`) gestionados desde la raíz.

---

## Estructura del repositorio

```
app_minutes/
├── backend/                       # API NestJS
│   └── src/
│       ├── auth/                  # Guards, validación de JWT, AAL2
│       ├── meetings/              # Reuniones (controller, service, dto)
│       ├── minutes/               # Minutas
│       ├── commitments/           # Compromisos
│       ├── users/                 # Gestión de usuarios (admin)
│       ├── audit/                 # Auditoría
│       ├── reports/               # Reportes
│       ├── signatures/            # Firma electrónica
│       ├── health/                # Healthcheck
│       └── common/                # Guards y utilidades transversales
│
├── frontend/                      # Aplicación Next.js
│   └── src/
│       ├── app/
│       │   ├── (protected)/       # Rutas autenticadas (dashboard, etc.)
│       │   ├── login/             # Inicio de sesión
│       │   ├── register/          # Registro público (si está habilitado)
│       │   └── account/           # Perfil del usuario
│       ├── components/            # UI compartida (shadcn/ui)
│       └── lib/                   # Cliente Supabase, helpers de roles, env
│
├── supabase/
│   └── migrations/                # Scripts SQL versionados (RLS, triggers, roles)
│
├── scripts/                       # Utilidades operativas (Node)
├── package.json                   # Workspaces y scripts globales
└── README.md
```

---

## Requisitos previos

- **Node.js 20 LTS** o superior y **npm 10+**.
- Acceso a un **proyecto de Supabase** con permisos para ejecutar SQL.
- (Opcional) Servicio **SigWeb de Topaz** instalado en Windows si se requiere captura de firma desde un pad físico.

---

## Instalación

Clonar el repositorio e instalar dependencias **desde la raíz** (los workspaces se resuelven automáticamente):

```bash
cd app_minutes
npm install --legacy-peer-deps
```

> El flag `--legacy-peer-deps` es necesario por la combinación de versiones de React 19 con algunas dependencias de UI.

---

## Configuración de entornos

El proyecto requiere dos archivos de variables de entorno: uno para el frontend y otro para el backend. Existen plantillas `*.env.example` en cada paquete.

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key | publishable_key>
NEXT_PUBLIC_API_URL=http://localhost:3001

# Opcionales
# NEXT_PUBLIC_INVITE_ONLY=true        # Deshabilita /register
# ADMIN_REQUIRE_AAL2=true             # Exige MFA (TOTP) a administradores
# NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL=/sigweb/SigWebTablet.js
```

### Backend — `backend/.env`

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000

SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_ANON_KEY=<misma_clave_que_frontend>

# Necesaria para alta de usuarios por administrador y scripts operativos.
# Nunca exponer en el frontend.
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Opcional: exigir MFA a administradores
# ADMIN_REQUIRE_AAL2=true
```

> Sin estas variables, el inicio de sesión, las llamadas a la API o la validación de tokens fallarán de forma controlada al arrancar.

---

## Migraciones de base de datos

Ejecutar los scripts en el **SQL Editor de Supabase**, en orden numérico:

| Archivo                                                | Propósito                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| _Tablas base_ (DDL del proyecto)                       | Crear extensiones, tablas y habilitar RLS. `public.users` debe contener al menos `id (uuid PK = auth.users.id)`, `email` y `role`. |
| `001_rls_policies_and_triggers.sql`                    | Políticas RLS base y trigger `on_auth_user_created`.                      |
| `002_user_role_from_signup_metadata.sql`               | Asigna rol al usuario desde `raw_user_meta_data` en el alta.              |
| `003_secretary_operational_writes_only.sql`            | Restringe operaciones de escritura a `secretary` y separa de `admin`.     |
| `004_ensure_public_users_from_auth.sql`                | Sincroniza cuentas existentes en `auth.users` hacia `public.users`.       |
| `005_users_self_insert_bootstrap.sql`                  | Permite el alta inicial del propio registro.                              |
| `006_has_any_app_role_jwt_fallback.sql`                | Fallback al claim del JWT cuando aún no hay fila en `public.users`.       |
| `007_admin_secretary_operational.sql`                  | Refinamientos finales de RLS para los flujos operativos.                  |

Si la tabla `public.users` queda vacía pero existen cuentas en **Authentication**, ejecutar `004_ensure_public_users_from_auth.sql` para reconstruir el trigger y copiar los usuarios.

---

## Ejecución en desarrollo

El proyecto se levanta con **dos terminales**, una para el backend y otra para el frontend.

**Terminal 1 — Backend (NestJS, puerto 3001):**

```bash
cd backend
npm run start:dev
```

**Terminal 2 — Frontend (Next.js, puerto 3000):**

```bash
cd frontend
npm run dev
```

> Alternativa: desde la raíz del repositorio se puede arrancar todo en paralelo con `npm run dev:all` (usa `concurrently`). Útil cuando no se necesitan logs separados.

**Verificar build y linter antes de hacer push** (desde la raíz):

```bash
npm run verify
```

Endpoints clave:

- Aplicación web: <http://localhost:3000>
- Páginas públicas: `/login`, `/register`
- Healthcheck del API: <http://localhost:3001/api/health>

---

## Roles y permisos

| Rol         | Permisos principales                                                                |
| ----------- | ----------------------------------------------------------------------------------- |
| `admin`     | Gestión de usuarios, configuración, auditoría. **No** crea reuniones ni minutas.    |
| `secretary` | Crea y administra reuniones, minutas, compromisos y firma.                          |
| (estándar)  | Visualiza sus reuniones, sus compromisos asignados y firma cuando corresponde.       |

La asignación de rol se realiza al registrar al usuario (vía metadata) o manualmente desde el SQL Editor:

```sql
UPDATE public.users SET role = 'secretary' WHERE email = 'usuario@dominio.com';
```

---

## Registro y alta de usuarios

- **Registro público**: página `/register`. Requiere contraseña fuerte (≥12 caracteres, mayúscula, minúscula, número y símbolo).
- **Modo invite-only**: definir `NEXT_PUBLIC_INVITE_ONLY=true` para deshabilitar el registro público; las cuentas se crean entonces desde el panel de administración.
- **Confirmación por correo**: si está activada en Supabase (`Authentication → Providers → Email → Confirm email`), el usuario debe abrir el enlace recibido antes de iniciar sesión.

Tras el alta, el trigger SQL inserta automáticamente la fila correspondiente en `public.users`.

---

## Scripts disponibles

### Por workspace (uso habitual)

| Carpeta     | Comando              | Descripción                                                |
| ----------- | -------------------- | ---------------------------------------------------------- |
| `backend/`  | `npm run start:dev`  | Levanta el API NestJS en modo watch (`tsc-watch`) en `:3001`. |
| `backend/`  | `npm run build`      | Compila el backend a `backend/dist/`.                      |
| `backend/`  | `npm run start`      | Ejecuta el backend ya compilado (`node dist/main.js`).     |
| `frontend/` | `npm run dev`        | Levanta Next.js en modo desarrollo en `:3000`.             |
| `frontend/` | `npm run build`      | Genera el build de producción de Next.js.                  |
| `frontend/` | `npm run start`      | Sirve el build de producción.                              |
| `frontend/` | `npm run lint`       | Ejecuta ESLint sobre el frontend.                          |

### Desde la raíz del repositorio (atajos del monorepo)

| Comando                         | Descripción                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev:all`               | Arranca backend y frontend simultáneamente (`concurrently`).                                      |
| `npm run dev:backend`           | Equivale a `npm run start:dev --workspace backend`.                                               |
| `npm run dev:frontend`          | Equivale a `npm run dev --workspace frontend`.                                                    |
| `npm run build`                 | Compila backend y frontend para producción.                                                       |
| `npm run lint`                  | Ejecuta ESLint sobre el frontend.                                                                 |
| `npm run verify`                | Equivale a `build` + `lint`. Recomendado antes de cada commit/push.                               |
| `npm run supabase:cleanup`      | **Solo desarrollo.** Elimina cuentas de prueba en Supabase. Requiere `SUPABASE_SERVICE_ROLE_KEY`. |
| `npm run seed:assignees`        | Crea responsables de demo para pruebas de compromisos.                                            |

---

## Build de producción

```bash
npm run build
```

Esto genera:

- `backend/dist/` con el bundle de NestJS (`node dist/main.js`).
- `frontend/.next/` con el build optimizado de Next.js (`next start`).

Para producción se recomienda servir backend y frontend tras un proxy inverso (HTTPS, compresión, cabeceras de seguridad) y mantener `SUPABASE_SERVICE_ROLE_KEY` exclusivamente como variable del servidor.

---

## Solución de problemas

**`email rate limit exceeded` durante el registro**
Es una protección de Supabase Auth. Opciones:

1. Desactivar temporalmente **Confirm email** en _Authentication → Providers → Email_ mientras se desarrolla.
2. Revisar y, si el plan lo permite, ampliar los **Rate Limits** del proyecto.
3. Esperar unos minutos o utilizar otro correo.

**No puedo iniciar sesión recién registrado**
Si la confirmación por correo está activada, abrir el enlace recibido antes de intentar autenticarse.

**Errores de RLS al crear reuniones/minutas**
Verificar que el usuario tenga rol `secretary` en `public.users` y que se hayan ejecutado las migraciones `003`, `006` y `007`.

**`public.users` vacía pero hay cuentas en Authentication**
Ejecutar `supabase/migrations/004_ensure_public_users_from_auth.sql`.

---

## Notas y trabajo futuro

- El backend valida cada token con Supabase Auth y reusa la **anon key + JWT del usuario** para preservar las políticas RLS en cada operación.
- La integración con el **pad Topaz vía SigWeb** está soportada en frontend (Windows). Requiere instalar el servicio SigWeb y copiar `SigWebTablet.js` a `frontend/public/sigweb/`.
- **Roadmap (siguientes fases según ERS):**
  - Cliente Electron empaquetado para escritorio.
  - Mejoras en la experiencia de captura de firma.
  - Notificaciones automáticas a responsables de compromisos.

---

**Licencia:** uso académico / interno del proyecto.

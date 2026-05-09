-- Helper de RLS: has_any_app_role.
-- Lee el rol de public.users.role; si está vacío, lo busca en el JWT (user_metadata o app_metadata).
-- Postgres resuelve la referencia a public.users de forma lazy, por lo que la función puede crearse
-- antes de que TypeORM cree la tabla; solo se evalúa cuando una policy la invoca.

CREATE OR REPLACE FUNCTION public.has_any_app_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  db_role text;
  jwt_role text;
  rr text;
BEGIN
  SELECT lower(trim(u.role::text)) INTO db_role
  FROM public.users u
  WHERE u.id = auth.uid();

  IF db_role IS NOT NULL AND db_role <> '' THEN
    FOREACH rr IN ARRAY required_roles
    LOOP
      IF db_role = lower(trim(rr)) THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  jwt_role := lower(trim(COALESCE(
    auth.jwt()->'user_metadata'->>'app_role',
    auth.jwt()->'user_metadata'->>'role',
    auth.jwt()->'app_metadata'->>'app_role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  )));

  IF jwt_role IS NULL OR jwt_role = '' OR jwt_role NOT IN ('admin', 'secretary') THEN
    RETURN FALSE;
  END IF;

  FOREACH rr IN ARRAY required_roles
  LOOP
    IF jwt_role = lower(trim(rr)) THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.has_any_app_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_any_app_role(text[]) TO authenticated;

-- Inmutabilidad: minutas firmadas/cerradas no se pueden editar ni borrar.
CREATE OR REPLACE FUNCTION public.minutes_immutable_when_signed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status::text IN ('SIGNED', 'CLOSED') THEN
      RAISE EXCEPTION 'No se puede eliminar una minuta firmada o cerrada';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text IN ('SIGNED', 'CLOSED') THEN
    RAISE EXCEPTION 'Las minutas firmadas o cerradas son inmutables';
  END IF;
  RETURN NEW;
END;
$$;

-- Bitácora append-only: cualquier UPDATE o DELETE sobre audit_log lanza excepción.
CREATE OR REPLACE FUNCTION public.audit_append_only_block()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es append-only';
END;
$$;

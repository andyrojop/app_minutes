-- Si `public.users.role` aún no está sincronizado, RLS puede usar el rol del JWT
-- (p. ej. signup `options.data.app_role` → user_metadata en el token).

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

-- Sincroniza auth.users -> public.users al crearse una cuenta nueva.
-- Resuelve el rol desde raw_user_meta_data.app_role (admin | secretary), default secretary.
-- Postgres compila la función con name resolution lazy: la referencia a public.users se
-- resuelve solo cuando el trigger dispara (es decir, después de que TypeORM haya creado la tabla).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text := NEW.raw_user_meta_data ->> 'app_role';
  resolved text;
BEGIN
  resolved := lower(trim(meta_role));
  IF resolved IS NULL OR resolved = '' OR resolved NOT IN ('admin', 'secretary') THEN
    resolved := 'secretary';
  END IF;

  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email::text, ''),
    resolved::public.user_role_enum
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.users.email),
    role = COALESCE(public.users.role, EXCLUDED.role);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

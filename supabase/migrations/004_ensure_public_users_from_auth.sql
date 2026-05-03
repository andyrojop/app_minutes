-- Garantiza que cada cuenta en auth.users tenga fila en public.users.
-- Ejecutar en Supabase → SQL Editor (como postgres). Antes asegúrate de tener tabla public.users con al menos id (uuid), email (text) y role (text).

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
    resolved
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.users.email),
    role = COALESCE(public.users.role, EXCLUDED.role);

  RETURN NEW;
END;
$$;

-- El propietario postgres suele omitir RLS en inserts desde el trigger (si tu proyecto usa otro owner, el INSERT puede fallar por políticas).
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.handle_new_user() OWNER TO postgres';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No se pudo cambiar OWNER de handle_new_user a postgres (ignorado).';
  WHEN OTHERS THEN
    RAISE NOTICE 'ALTER OWNER handle_new_user: %', SQLERRM;
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

-- Usuarios que ya existen en Auth pero no tienen fila en public.users
INSERT INTO public.users (id, email, role)
SELECT
  au.id,
  COALESCE(au.email::text, ''),
  CASE
    WHEN lower(trim(COALESCE(au.raw_user_meta_data ->> 'app_role', ''))) IN ('admin', 'secretary')
      THEN lower(trim(au.raw_user_meta_data ->> 'app_role'))
    ELSE 'secretary'
  END
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);

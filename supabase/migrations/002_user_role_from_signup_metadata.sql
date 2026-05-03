-- Al registrarse, el frontend envía options.data.app_role en signUp → raw_user_meta_data.
-- Valores válidos: admin | secretary (fallback: secretary).

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
  IF resolved IS NULL OR resolved = '' OR resolved NOT IN (
    'admin', 'secretary'
  ) THEN
    resolved := 'secretary';
  END IF;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, resolved)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Si el usuario ya existía sin rol (trigger viejo), completar desde metadatos
    role = COALESCE(public.users.role, EXCLUDED.role);

  RETURN NEW;
END;
$$;

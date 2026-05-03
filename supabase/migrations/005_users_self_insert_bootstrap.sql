-- Si el trigger auth→public.users falló, el usuario puede crear solo su fila (no la de otros).
CREATE POLICY users_insert_own_row
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

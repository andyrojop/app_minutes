-- Ejecutar en el SQL Editor de Supabase después de tu DDL base (tablas + RLS enabled).
-- Roles esperados en public.users.role: admin | secretary

-- Función auxiliar: evita recursión en políticas de users leyendo rol con SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.has_any_app_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = ANY (required_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.has_any_app_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_any_app_role(text[]) TO authenticated;

-- Sincronizar auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Minutas firmadas/cerradas: inmutables (además de CHECK en app)
CREATE OR REPLACE FUNCTION public.minutes_immutable_when_signed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('SIGNED', 'CLOSED') THEN
      RAISE EXCEPTION 'No se puede eliminar una minuta firmada o cerrada';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('SIGNED', 'CLOSED') THEN
    RAISE EXCEPTION 'Las minutas firmadas o cerradas son inmutables';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS minutes_immutable_when_signed ON public.minutes;
CREATE TRIGGER minutes_immutable_when_signed
  BEFORE UPDATE OR DELETE ON public.minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.minutes_immutable_when_signed();

-- Bitácora append-only
CREATE OR REPLACE FUNCTION public.audit_append_only_block()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_no_update ON public.audit_log;
DROP TRIGGER IF EXISTS audit_no_delete ON public.audit_log;
CREATE TRIGGER audit_no_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_append_only_block();
CREATE TRIGGER audit_no_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_append_only_block();

-- ==================== RLS: limpiar políticas previas (re-ejecutable) ====================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users',
        'meetings',
        'meeting_attendees',
        'minutes',
        'commitments',
        'signatures',
        'attachments',
        'audit_log'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- users
CREATE POLICY users_select_own_or_privileged
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
  );

CREATE POLICY users_update_self
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY users_admin_manage
  ON public.users FOR UPDATE TO authenticated
  USING (public.has_any_app_role (ARRAY['admin']))
  WITH CHECK (public.has_any_app_role (ARRAY['admin']));

CREATE POLICY users_admin_insert
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role (ARRAY['admin']));

-- meetings
CREATE POLICY meetings_select_visible
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meeting_attendees ma
      WHERE ma.meeting_id = meetings.id AND ma.user_id = auth.uid()
    )
    OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
  );

CREATE POLICY meetings_insert_staff
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND public.has_any_app_role (ARRAY['admin','secretary'])
  );

CREATE POLICY meetings_update_organizer_or_staff
  ON public.meetings FOR UPDATE TO authenticated
  USING (
    public.has_any_app_role (ARRAY['admin','secretary'])
    OR organizer_id = auth.uid()
  )
  WITH CHECK (
    public.has_any_app_role (ARRAY['admin','secretary'])
    OR organizer_id = auth.uid()
  );

-- meeting_attendees
CREATE POLICY meeting_attendees_select
  ON public.meeting_attendees FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_attendees.meeting_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_attendees mx
            WHERE mx.meeting_id = m.id AND mx.user_id = auth.uid()
          )
          OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
        )
    )
  );

CREATE POLICY meeting_attendees_write
  ON public.meeting_attendees FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role (ARRAY['admin','secretary'])
    OR EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_attendees.meeting_id AND m.organizer_id = auth.uid()
    )
  );

CREATE POLICY meeting_attendees_delete
  ON public.meeting_attendees FOR DELETE TO authenticated
  USING (
    public.has_any_app_role (ARRAY['admin','secretary'])
    OR EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_attendees.meeting_id AND m.organizer_id = auth.uid()
    )
  );

-- minutes
CREATE POLICY minutes_select_by_meeting_access
  ON public.minutes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = minutes.meeting_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_attendees ma
            WHERE ma.meeting_id = m.id AND ma.user_id = auth.uid()
          )
          OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
        )
    )
  );

CREATE POLICY minutes_insert_staff
  ON public.minutes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role (ARRAY['admin','secretary'])
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = minutes.meeting_id
        AND (
          public.has_any_app_role (ARRAY['admin','secretary'])
          OR m.organizer_id = auth.uid()
        )
    )
  );

CREATE POLICY minutes_update_staff
  ON public.minutes FOR UPDATE TO authenticated
  USING (public.has_any_app_role (ARRAY['admin','secretary']))
  WITH CHECK (public.has_any_app_role (ARRAY['admin','secretary']));

CREATE POLICY minutes_delete_draft_staff
  ON public.minutes FOR DELETE TO authenticated
  USING (
    status = 'DRAFT'
    AND public.has_any_app_role (ARRAY['admin','secretary'])
  );

-- commitments
CREATE POLICY commitments_select
  ON public.commitments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.minutes mn
      JOIN public.meetings m ON m.id = mn.meeting_id
      WHERE mn.id = commitments.minute_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_attendees ma
            WHERE ma.meeting_id = m.id AND ma.user_id = auth.uid()
          )
          OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
        )
    )
  );

CREATE POLICY commitments_write_staff
  ON public.commitments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role (ARRAY['admin','secretary']));

CREATE POLICY commitments_update_staff_or_assignee
  ON public.commitments FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid()
    OR public.has_any_app_role (ARRAY['admin','secretary'])
  )
  WITH CHECK (
    assignee_id = auth.uid()
    OR public.has_any_app_role (ARRAY['admin','secretary'])
  );

-- signatures
CREATE POLICY signatures_select
  ON public.signatures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.minutes mn
      JOIN public.meetings m ON m.id = mn.meeting_id
      WHERE mn.id = signatures.minute_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_attendees ma
            WHERE ma.meeting_id = m.id AND ma.user_id = auth.uid()
          )
          OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
        )
    )
  );

CREATE POLICY signatures_insert_own
  ON public.signatures FOR INSERT TO authenticated
  WITH CHECK (signer_id = auth.uid());

-- attachments
CREATE POLICY attachments_select
  ON public.attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.minutes mn
      JOIN public.meetings m ON m.id = mn.meeting_id
      WHERE mn.id = attachments.minute_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_attendees ma
            WHERE ma.meeting_id = m.id AND ma.user_id = auth.uid()
          )
          OR public.has_any_app_role (ARRAY['admin','secretary','auditor'])
        )
    )
  );

CREATE POLICY attachments_write_staff
  ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role (ARRAY['admin','secretary'])
    AND uploaded_by = auth.uid()
  );

-- audit_log
CREATE POLICY audit_select_admin_auditor
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_any_app_role (ARRAY['admin','auditor']));

CREATE POLICY audit_insert_self_actor
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Operación día a día solo rol secretary; admin se usa para configuración (usuarios, etc.).
-- Ejecutar después de 001 (y 002 si aplica). Replica políticas tocadas.

-- users: lectura privilegiada solo admin/secretary (sin auditor legado)
DROP POLICY IF EXISTS users_select_own_or_privileged ON public.users;
CREATE POLICY users_select_own_or_privileged
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_any_app_role (ARRAY['admin', 'secretary'])
  );

-- meetings
DROP POLICY IF EXISTS meetings_insert_staff ON public.meetings;
CREATE POLICY meetings_insert_staff
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND public.has_any_app_role (ARRAY['secretary'])
  );

DROP POLICY IF EXISTS meetings_update_organizer_or_staff ON public.meetings;
CREATE POLICY meetings_update_secretary
  ON public.meetings FOR UPDATE TO authenticated
  USING (public.has_any_app_role (ARRAY['secretary']))
  WITH CHECK (public.has_any_app_role (ARRAY['secretary']));

-- meeting_attendees
DROP POLICY IF EXISTS meeting_attendees_write ON public.meeting_attendees;
CREATE POLICY meeting_attendees_write
  ON public.meeting_attendees FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role (ARRAY['secretary']));

DROP POLICY IF EXISTS meeting_attendees_delete ON public.meeting_attendees;
CREATE POLICY meeting_attendees_delete
  ON public.meeting_attendees FOR DELETE TO authenticated
  USING (public.has_any_app_role (ARRAY['secretary']));

-- minutes
DROP POLICY IF EXISTS minutes_insert_staff ON public.minutes;
CREATE POLICY minutes_insert_staff
  ON public.minutes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role (ARRAY['secretary'])
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = minutes.meeting_id
    )
  );

DROP POLICY IF EXISTS minutes_update_staff ON public.minutes;
CREATE POLICY minutes_update_staff
  ON public.minutes FOR UPDATE TO authenticated
  USING (public.has_any_app_role (ARRAY['secretary']))
  WITH CHECK (public.has_any_app_role (ARRAY['secretary']));

DROP POLICY IF EXISTS minutes_delete_draft_staff ON public.minutes;
CREATE POLICY minutes_delete_draft_staff
  ON public.minutes FOR DELETE TO authenticated
  USING (
    status = 'DRAFT'
    AND public.has_any_app_role (ARRAY['secretary'])
  );

-- commitments
DROP POLICY IF EXISTS commitments_write_staff ON public.commitments;
CREATE POLICY commitments_write_staff
  ON public.commitments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role (ARRAY['secretary']));

DROP POLICY IF EXISTS commitments_update_staff_or_assignee ON public.commitments;
CREATE POLICY commitments_update_staff_or_assignee
  ON public.commitments FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid()
    OR public.has_any_app_role (ARRAY['secretary'])
  )
  WITH CHECK (
    assignee_id = auth.uid()
    OR public.has_any_app_role (ARRAY['secretary'])
  );

-- attachments
DROP POLICY IF EXISTS attachments_write_staff ON public.attachments;
CREATE POLICY attachments_write_staff
  ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role (ARRAY['secretary'])
    AND uploaded_by = auth.uid()
  );

-- audit: solo admin consulta bitácora en despliegues de 2 roles
DROP POLICY IF EXISTS audit_select_admin_auditor ON public.audit_log;
CREATE POLICY audit_select_admin_only
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_any_app_role (ARRAY['admin']));

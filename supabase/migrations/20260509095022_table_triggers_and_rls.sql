-- Triggers sobre tablas de public.* y todas las RLS policies.
-- Esta migration depende de que las tablas ya existan (las crea TypeORM en database/migrations/InitialSchema).
-- Por eso se aplica con `supabase migration up` DESPUÉS de `npm run migration:run`.

-- ===== Triggers que requieren las tablas existentes =====
DROP TRIGGER IF EXISTS minutes_immutable_when_signed ON public.minutes;
CREATE TRIGGER minutes_immutable_when_signed
  BEFORE UPDATE OR DELETE ON public.minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.minutes_immutable_when_signed();

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

-- ===== ENABLE ROW LEVEL SECURITY =====
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES =====
-- users
DROP POLICY IF EXISTS users_select_own_or_privileged ON public.users;
CREATE POLICY users_select_own_or_privileged
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
  );

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_admin_manage ON public.users;
CREATE POLICY users_admin_manage
  ON public.users FOR UPDATE TO authenticated
  USING (public.has_any_app_role(ARRAY['admin']))
  WITH CHECK (public.has_any_app_role(ARRAY['admin']));

DROP POLICY IF EXISTS users_admin_insert ON public.users;
CREATE POLICY users_admin_insert
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role(ARRAY['admin']));

DROP POLICY IF EXISTS users_insert_own_row ON public.users;
CREATE POLICY users_insert_own_row
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- meetings
DROP POLICY IF EXISTS meetings_select_visible ON public.meetings;
CREATE POLICY meetings_select_visible
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meeting_attendees ma
      WHERE ma.meeting_id = meetings.id AND ma.user_id = auth.uid()
    )
    OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
  );

DROP POLICY IF EXISTS meetings_insert_staff ON public.meetings;
CREATE POLICY meetings_insert_staff
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND public.has_any_app_role(ARRAY['admin','secretary'])
  );

DROP POLICY IF EXISTS meetings_update_staff ON public.meetings;
CREATE POLICY meetings_update_staff
  ON public.meetings FOR UPDATE TO authenticated
  USING (public.has_any_app_role(ARRAY['admin','secretary']))
  WITH CHECK (public.has_any_app_role(ARRAY['admin','secretary']));

DROP POLICY IF EXISTS meetings_delete_staff ON public.meetings;
CREATE POLICY meetings_delete_staff
  ON public.meetings FOR DELETE TO authenticated
  USING (public.has_any_app_role(ARRAY['admin','secretary']));

-- meeting_attendees
DROP POLICY IF EXISTS meeting_attendees_select ON public.meeting_attendees;
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
          OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
        )
    )
  );

DROP POLICY IF EXISTS meeting_attendees_write ON public.meeting_attendees;
CREATE POLICY meeting_attendees_write
  ON public.meeting_attendees FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role(ARRAY['admin','secretary']));

DROP POLICY IF EXISTS meeting_attendees_delete ON public.meeting_attendees;
CREATE POLICY meeting_attendees_delete
  ON public.meeting_attendees FOR DELETE TO authenticated
  USING (public.has_any_app_role(ARRAY['admin','secretary']));

-- minutes
DROP POLICY IF EXISTS minutes_select_by_meeting_access ON public.minutes;
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
          OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
        )
    )
  );

DROP POLICY IF EXISTS minutes_insert_staff ON public.minutes;
CREATE POLICY minutes_insert_staff
  ON public.minutes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role(ARRAY['admin','secretary'])
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = minutes.meeting_id
    )
  );

DROP POLICY IF EXISTS minutes_update_staff ON public.minutes;
CREATE POLICY minutes_update_staff
  ON public.minutes FOR UPDATE TO authenticated
  USING (public.has_any_app_role(ARRAY['admin','secretary']))
  WITH CHECK (public.has_any_app_role(ARRAY['admin','secretary']));

DROP POLICY IF EXISTS minutes_delete_draft_staff ON public.minutes;
CREATE POLICY minutes_delete_draft_staff
  ON public.minutes FOR DELETE TO authenticated
  USING (
    status::text = 'DRAFT'
    AND public.has_any_app_role(ARRAY['admin','secretary'])
  );

-- commitments
DROP POLICY IF EXISTS commitments_select ON public.commitments;
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
          OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
        )
    )
  );

DROP POLICY IF EXISTS commitments_write_staff ON public.commitments;
CREATE POLICY commitments_write_staff
  ON public.commitments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_app_role(ARRAY['admin','secretary']));

DROP POLICY IF EXISTS commitments_update_staff_or_assignee ON public.commitments;
CREATE POLICY commitments_update_staff_or_assignee
  ON public.commitments FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid()
    OR public.has_any_app_role(ARRAY['admin','secretary'])
  )
  WITH CHECK (
    assignee_id = auth.uid()
    OR public.has_any_app_role(ARRAY['admin','secretary'])
  );

-- signatures
DROP POLICY IF EXISTS signatures_select ON public.signatures;
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
          OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
        )
    )
  );

DROP POLICY IF EXISTS signatures_insert_own ON public.signatures;
CREATE POLICY signatures_insert_own
  ON public.signatures FOR INSERT TO authenticated
  WITH CHECK (signer_id = auth.uid());

-- attachments
DROP POLICY IF EXISTS attachments_select ON public.attachments;
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
          OR public.has_any_app_role(ARRAY['admin','secretary','auditor'])
        )
    )
  );

DROP POLICY IF EXISTS attachments_write_staff ON public.attachments;
CREATE POLICY attachments_write_staff
  ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_app_role(ARRAY['admin','secretary'])
    AND uploaded_by = auth.uid()
  );

-- audit_log
DROP POLICY IF EXISTS audit_select_admin_auditor ON public.audit_log;
CREATE POLICY audit_select_admin_auditor
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_any_app_role(ARRAY['admin','auditor']));

DROP POLICY IF EXISTS audit_insert_self_actor ON public.audit_log;
CREATE POLICY audit_insert_self_actor
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

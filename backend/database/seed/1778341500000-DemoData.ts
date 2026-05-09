import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seed: datos de demo para probar el flujo completo.
 * Usa los IDs reales de las cuentas Supabase Auth ya creadas:
 *   - Admin:      0a8fd490-e7c6-408e-b204-8245595ba428
 *   - Secretary:  b2f44b92-d688-4152-bccf-77305665600f
 *
 * Idempotente: INSERT ... ON CONFLICT DO UPDATE. Re-correr refresca contenido.
 * Para limpiar: `npm run seed:revert`.
 */

const ADMIN_ID = "0a8fd490-e7c6-408e-b204-8245595ba428";
const SECRETARY_ID = "b2f44b92-d688-4152-bccf-77305665600f";

const M1 = "11111111-1111-1111-1111-000000000001";
const M2 = "11111111-1111-1111-1111-000000000002";
const M3 = "11111111-1111-1111-1111-000000000003";

const MIN1 = "22222222-2222-2222-2222-000000000001";
const MIN2 = "22222222-2222-2222-2222-000000000002";
const MIN3 = "22222222-2222-2222-2222-000000000003";

const C1 = "33333333-3333-3333-3333-000000000001";
const C2 = "33333333-3333-3333-3333-000000000002";
const C3 = "33333333-3333-3333-3333-000000000003";
const C4 = "33333333-3333-3333-3333-000000000004";
const C5 = "33333333-3333-3333-3333-000000000005";
const C6 = "33333333-3333-3333-3333-000000000006";

const A1 = "44444444-4444-4444-4444-000000000001";
const A2 = "44444444-4444-4444-4444-000000000002";
const A3 = "44444444-4444-4444-4444-000000000003";
const A4 = "44444444-4444-4444-4444-000000000004";
const A5 = "44444444-4444-4444-4444-000000000005";

const DRAFT_MIN1_CONTENT = JSON.stringify({
  agenda: "Revisar bloqueos del sprint actual y planear el siguiente.",
  desarrollo: "",
  acuerdos: "",
  observaciones: "",
});
const DRAFT_MIN2_CONTENT = JSON.stringify({
  agenda: "Compromisos vencidos. Próximas entregas.",
  desarrollo: "Se discutieron los compromisos vencidos y se reasignaron responsables.",
  acuerdos: "Se acordó cerrar los pendientes esta semana.",
  observaciones: "",
});
const DRAFT_MIN3_CONTENT = JSON.stringify({
  agenda: "Resultados Q4. Reasignación de responsabilidades.",
  desarrollo: "Resultados positivos del trimestre. Crecimiento del 12%.",
  acuerdos: "Aprobar plan de bonificaciones. Reasignar a Juan al área comercial.",
  observaciones: "Acta firmada por todos los asistentes.",
});

export class DemoData1778341500000 implements MigrationInterface {
  name = "DemoData1778341500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== MEETINGS =====
    const meetings: Array<[string, string, string, string, string, string, string]> = [
      [M1, "Reunión semanal de coordinación", "Revisión de avance de proyectos. Próximos hitos. Bloqueos.", "Sala de juntas A", "+7 days", ADMIN_ID, "SCHEDULED"],
      [M2, "Comité de seguimiento (en curso)", "Estado de compromisos vencidos. Plan de cierre del trimestre.", "Sala virtual", "0 days", SECRETARY_ID, "ONGOING"],
      [M3, "Junta extraordinaria del trimestre", "Resultados financieros. Reasignación de responsabilidades.", "Sede principal", "-7 days", SECRETARY_ID, "FINISHED"],
    ];
    for (const [id, title, agenda, location, offset, organizer, status] of meetings) {
      await queryRunner.query(
        `
        INSERT INTO public.meetings (id, title, agenda, location, scheduled_at, organizer_id, status, created_at, updated_at)
        VALUES ($1::uuid, $2, $3, $4, NOW() + $5::interval, $6::uuid, $7::public.meeting_status_enum, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          agenda = EXCLUDED.agenda,
          location = EXCLUDED.location,
          scheduled_at = EXCLUDED.scheduled_at,
          organizer_id = EXCLUDED.organizer_id,
          status = EXCLUDED.status,
          updated_at = NOW();
        `,
        [id, title, agenda, location, offset, organizer, status],
      );
    }

    // ===== ATTENDEES =====
    const attendees: Array<[string, string, string, boolean | null]> = [
      [M1, ADMIN_ID, "organizador", true],
      [M1, SECRETARY_ID, "convocado", null],
      [M2, SECRETARY_ID, "organizadora", true],
      [M2, ADMIN_ID, "convocado", true],
      [M3, SECRETARY_ID, "organizadora", true],
      [M3, ADMIN_ID, "convocado", true],
    ];
    for (const [meetingId, userId, role, attended] of attendees) {
      await queryRunner.query(
        `
        INSERT INTO public.meeting_attendees (meeting_id, user_id, role, attended)
        VALUES ($1::uuid, $2::uuid, $3, $4::boolean)
        ON CONFLICT (meeting_id, user_id) DO UPDATE SET
          role = EXCLUDED.role,
          attended = EXCLUDED.attended;
        `,
        [meetingId, userId, role, attended],
      );
    }

    // ===== MINUTAS =====
    const minutes: Array<[string, string, string]> = [
      [MIN1, M1, DRAFT_MIN1_CONTENT],
      [MIN2, M2, DRAFT_MIN2_CONTENT],
      [MIN3, M3, DRAFT_MIN3_CONTENT],
    ];
    for (const [id, meetingId, content] of minutes) {
      await queryRunner.query(
        `
        INSERT INTO public.minutes (id, meeting_id, content, version, status, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3::jsonb, 1, 'DRAFT', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          updated_at = NOW();
        `,
        [id, meetingId, content],
      );
    }

    // ===== COMMITMENTS =====
    const commitments: Array<[string, string, string, string, string, string, string]> = [
      [C1, MIN1, "Preparar presentación del sprint para el comité ejecutivo", SECRETARY_ID, "+7 days", "alta", "pendiente"],
      [C2, MIN1, "Documentar bloqueos pendientes y sus mitigaciones", ADMIN_ID, "+3 days", "media", "en_progreso"],
      [C3, MIN2, "Cerrar tickets atrasados antes del viernes", SECRETARY_ID, "+3 days", "alta", "pendiente"],
      [C4, MIN2, "Actualizar el dashboard de KPIs trimestrales", ADMIN_ID, "0 days", "baja", "cumplido"],
      [C5, MIN3, "Reasignar tareas del área comercial", ADMIN_ID, "-7 days", "media", "vencido"],
      [C6, MIN3, "Comunicar plan de bonificaciones al equipo", SECRETARY_ID, "-1 day", "alta", "vencido"],
    ];
    for (const [id, minuteId, description, assignee, dueOffset, priority, status] of commitments) {
      await queryRunner.query(
        `
        INSERT INTO public.commitments (id, minute_id, description, assignee_id, due_date, priority, status, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3, $4::uuid, (CURRENT_DATE + $5::interval)::date, $6::public.priority_enum, $7::public.commitment_status_enum, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description,
          assignee_id = EXCLUDED.assignee_id,
          due_date = EXCLUDED.due_date,
          priority = EXCLUDED.priority,
          status = EXCLUDED.status,
          updated_at = NOW();
        `,
        [id, minuteId, description, assignee, dueOffset, priority, status],
      );
    }

    // ===== AUDIT LOG =====
    const audits: Array<[string, string, string, string, string, string]> = [
      [A1, SECRETARY_ID, "meeting.create", "meeting", M3, "-7 days"],
      [A2, SECRETARY_ID, "minute.create", "minute", MIN3, "-7 days"],
      [A3, SECRETARY_ID, "commitment.create", "commitment", C5, "-7 days"],
      [A4, ADMIN_ID, "meeting.create", "meeting", M1, "-1 day"],
      [A5, ADMIN_ID, "commitment.update", "commitment", C1, "-1 hour"],
    ];
    for (const [id, actor, action, resourceType, resourceId, offset] of audits) {
      await queryRunner.query(
        `
        INSERT INTO public.audit_log (id, actor_id, action, resource_type, resource_id, ip, created_at)
        VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, '127.0.0.1', NOW() + $6::interval)
        ON CONFLICT (id) DO NOTHING;
        `,
        [id, actor, action, resourceType, resourceId, offset],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // El trigger audit_no_delete bloquea DELETE en audit_log, así que solo borramos data limpiamente.
    await queryRunner.query(
      `DELETE FROM public.commitments WHERE id IN ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid)`,
      [C1, C2, C3, C4, C5, C6],
    );
    await queryRunner.query(
      `DELETE FROM public.minutes WHERE id IN ($1::uuid, $2::uuid, $3::uuid)`,
      [MIN1, MIN2, MIN3],
    );
    await queryRunner.query(
      `DELETE FROM public.meeting_attendees WHERE meeting_id IN ($1::uuid, $2::uuid, $3::uuid)`,
      [M1, M2, M3],
    );
    await queryRunner.query(
      `DELETE FROM public.meetings WHERE id IN ($1::uuid, $2::uuid, $3::uuid)`,
      [M1, M2, M3],
    );
    // audit_log es append-only por trigger; no se borra.
  }
}

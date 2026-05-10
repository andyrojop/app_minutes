export type MeetingStatus = "SCHEDULED" | "ONGOING" | "FINISHED" | "CANCELLED";

export type MinuteStatus = "DRAFT" | "SIGNING" | "SIGNED" | "CLOSED";

export type UserRole =
  | "admin"
  | "secretary";

export type MeetingRow = {
  id: string;
  title: string;
  agenda: string | null;
  scheduled_at: string | null;
  location: string | null;
  organizer_id: string | null;
  status: MeetingStatus;
  created_at: string;
};

export type UserRow = {
  id: string;
  email: string | null;
  role: UserRole | string;
  is_active: boolean | null;
  created_at: string | null;
};

export type MinuteRow = {
  id: string;
  meeting_id: string;
  content: Record<string, unknown> | null;
  version: number;
  status: MinuteStatus;
  content_hash: string | null;
  signed_pdf_url: string | null;
  created_at: string;
};

export type CommitmentRow = {
  id: string;
  minute_id: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  created_at: string;
};

export type SignatureRow = {
  id: string;
  minute_id: string;
  signer_id: string;
  signature_svg: string | null;
  signed_at: string;
  metadata: Record<string, unknown> | null;
  signer_email: string | null;
};

export type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip: string | null;
  created_at: string;
};

export type ReportsDashboard = {
  totals: { meetings: number; commitments: number; minutes: number };
  commitments_by_status: Record<string, number>;
};

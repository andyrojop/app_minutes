import { Injectable } from "@nestjs/common";

import { CommitmentsService } from "../commitments/commitments.service";
import { createUserScopedClient } from "../supabase/supabase";

@Injectable()
export class ReportsService {
  constructor(private readonly commitments: CommitmentsService) {}

  async dashboard(accessToken: string) {
    await this.commitments.expireOverdue(accessToken);
    const sb = createUserScopedClient(accessToken);

    const [meetings, commitments, minutes, statusRows] = await Promise.all([
      sb.from("meetings").select("*", { count: "exact", head: true }),
      sb.from("commitments").select("*", { count: "exact", head: true }),
      sb.from("minutes").select("*", { count: "exact", head: true }),
      sb.from("commitments").select("status"),
    ]);

    if (statusRows.error) throw new Error(statusRows.error.message);

    const tally: Record<string, number> = {};
    for (const row of statusRows.data ?? []) {
      const s = (row as { status?: string }).status ?? "sin_estado";
      tally[s] = (tally[s] ?? 0) + 1;
    }

    return {
      totals: {
        meetings: meetings.count ?? 0,
        commitments: commitments.count ?? 0,
        minutes: minutes.count ?? 0,
      },
      commitments_by_status: tally,
    };
  }
}

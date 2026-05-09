import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CommitmentsService } from "../commitments/commitments.service";
import { Commitment } from "../models/commitment.entity";
import { Meeting } from "../models/meeting.entity";
import { Minute } from "../models/minute.entity";

@Injectable()
export class ReportsService {
  constructor(
    private readonly commitments: CommitmentsService,
    @InjectRepository(Meeting) private readonly meetingsRepo: Repository<Meeting>,
    @InjectRepository(Minute) private readonly minutesRepo: Repository<Minute>,
    @InjectRepository(Commitment) private readonly commitmentsRepo: Repository<Commitment>,
  ) {}

  async dashboard(accessToken: string) {
    await this.commitments.expireOverdue(accessToken);

    const [meetingsCount, commitmentsCount, minutesCount, byStatus] = await Promise.all([
      this.meetingsRepo.count(),
      this.commitmentsRepo.count(),
      this.minutesRepo.count(),
      this.commitmentsRepo
        .createQueryBuilder("c")
        .select("c.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("c.status")
        .getRawMany<{ status: string | null; count: string }>(),
    ]);

    const tally: Record<string, number> = {};
    for (const row of byStatus) {
      const key = row.status ?? "sin_estado";
      tally[key] = Number(row.count);
    }

    return {
      totals: {
        meetings: meetingsCount,
        commitments: commitmentsCount,
        minutes: minutesCount,
      },
      commitments_by_status: tally,
    };
  }
}

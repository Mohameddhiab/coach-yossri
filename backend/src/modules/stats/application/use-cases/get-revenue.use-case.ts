import { Inject, Injectable } from '@nestjs/common';
import { monthlyKeys } from '@/shared/domain/stats';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import { StatsData } from '../stats-data';

@Injectable()
export class GetRevenueUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    private readonly data: StatsData,
  ) {}

  async execute(coachId: string, monthsRaw?: string) {
    const months = Math.max(1, Math.min(24, Number(monthsRaw) || 12));
    const ctx = await this.data.load(coachId);
    const keys = monthlyKeys(months);

    const rows = keys.map((key) => ({
      mois: key,
      total: 0,
      count: 0,
      cumul: 0,
      par_tier: { ONLINE: 0, PREMIUM_COACH: 0 },
    }));
    const byKey = new Map(rows.map((r) => [r.mois, r]));

    const subs = (await this.stats.allSubscriptions()).filter((s) =>
      ctx.memberIds.has(s.userId),
    );
    for (const s of subs) {
      const bucket = byKey.get(s.createdAt.toISOString().slice(0, 7));
      if (!bucket) continue;
      bucket.total += s.montant;
      bucket.count += 1;
      if (s.tier === 'ONLINE') bucket.par_tier.ONLINE += s.montant;
      else if (s.tier === 'PREMIUM_COACH')
        bucket.par_tier.PREMIUM_COACH += s.montant;
    }

    let cumul = 0;
    for (const r of rows) {
      cumul += r.total;
      r.cumul = cumul;
    }

    return rows;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { monthlyKeys, latestSubscription } from '@/shared/domain/stats';
import { effectiveDateFin } from '@/shared/domain/subscription-status';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import { StatsData } from '../stats-data';

@Injectable()
export class GetGrowthUseCase {
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
      nouveaux: 0,
      cumul: 0,
      revenus: 0,
      cumul_revenus: 0,
      attrition: 0,
      actifs_fin: 0,
    }));
    const byKey = new Map(rows.map((r) => [r.mois, r]));

    for (const m of ctx.members) {
      const bucket = byKey.get(m.createdAt.toISOString().slice(0, 7));
      if (bucket) bucket.nouveaux += 1;

      const list = ctx.subsByUser.get(m.id) ?? [];
      const latest = latestSubscription(list);
      if (latest) {
        const end = effectiveDateFin(latest).getTime();
        for (const key of keys) {
          const monthStart = new Date(key + '-01T00:00:00Z').getTime();
          const monthEnd = monthStart + 32 * 86400000;
          if (end >= monthStart && end < monthEnd) {
            byKey.get(key)!.attrition += 1;
          }
          if (end >= monthEnd) byKey.get(key)!.actifs_fin += 1;
        }
      }
    }

    const subs = (await this.stats.allSubscriptions()).filter((s) =>
      ctx.memberIds.has(s.userId),
    );
    for (const s of subs) {
      const bucket = byKey.get(s.createdAt.toISOString().slice(0, 7));
      if (bucket) bucket.revenus += s.montant;
    }

    let cumul = 0;
    let cumulRevenus = 0;
    for (const r of rows) {
      cumul += r.nouveaux;
      cumulRevenus += r.revenus;
      r.cumul = cumul;
      r.cumul_revenus = cumulRevenus;
    }

    return rows;
  }
}

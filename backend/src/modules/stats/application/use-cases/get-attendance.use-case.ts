import { Inject, Injectable } from '@nestjs/common';
import { dayKey } from '@/shared/domain/stats';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import { toUserApi } from '@/shared/mapping/api.mapper';
import { StatsData } from '../stats-data';

@Injectable()
export class GetAttendanceUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    private readonly data: StatsData,
  ) {}

  async execute(coachId: string, daysRaw?: string, limitRaw?: string) {
    const days = Math.max(1, Math.min(90, Number(daysRaw) || 30));
    const limit = Math.max(1, Math.min(100, Number(limitRaw) || 10));
    const ctx = await this.data.load(coachId);

    const from = Date.now() - (days - 1) * 86400000;
    const inWindow = ctx.checkIns
      .filter((c) => c.checkedAt.getTime() >= from)
      .sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime());

    const perDay = new Map<string, number>();
    inWindow.forEach((c) => {
      perDay.set(
        dayKey(c.checkedAt),
        (perDay.get(dayKey(c.checkedAt)) ?? 0) + 1,
      );
    });
    const par_jour: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i += 1) {
      const key = dayKey(new Date(from + i * 86400000));
      par_jour.push({ date: key, count: perDay.get(key) ?? 0 });
    }

    const perMember = new Map<string, number>();
    inWindow.forEach((c) => {
      perMember.set(c.userId, (perMember.get(c.userId) ?? 0) + 1);
    });

    const membres = new Map(ctx.members.map((m) => [m.id, m]));
    const par_membre = [...perMember.entries()]
      .map(([userId, count]) => {
        const m = membres.get(userId);
        if (!m) return null;
        return {
          user_id: userId,
          user: toUserApi(m),
          count,
          ratio: Math.round((count / days) * 100) / 100,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      days,
      total: inWindow.length,
      moyenne_par_jour: days
        ? Math.round((inWindow.length / days) * 100) / 100
        : 0,
      par_jour,
      par_membre,
    };
  }
}

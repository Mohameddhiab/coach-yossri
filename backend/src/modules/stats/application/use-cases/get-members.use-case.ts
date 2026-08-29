import { Injectable } from '@nestjs/common';
import {
  buildMemberAnalytics,
  type MemberAnalytics,
} from '../member-analytics';
import { StatsData } from '../stats-data';

@Injectable()
export class GetMembersUseCase {
  constructor(private readonly data: StatsData) {}

  async execute(coachId: string): Promise<MemberAnalytics[]> {
    const ctx = await this.data.load(coachId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const now = Date.now();
    const yes7 = now - 7 * 86400000;

    const rows = ctx.members.map((m): MemberAnalytics => {
      const checkIns = ctx.checkIns.filter((c) => c.userId === m.id);
      return buildMemberAnalytics({
        user: m,
        subscriptionsOf: ctx.subsByUser.get(m.id) ?? [],
        weightLogs: ctx.weightsByUser.get(m.id) ?? [],
        target: (ctx.targetsByUser.get(m.id) ?? [])[0] ?? null,
        goal:
          (ctx.goalsByUser.get(m.id) ?? []).find(
            (g) => g.mois === currentMonth,
          ) ?? null,
        planVersion: ctx.versionsByUser.get(m.id) ?? null,
        checkInCountTotal: checkIns.length,
        checkInCount7d: checkIns.filter((c) => c.checkedAt.getTime() >= yes7)
          .length,
        followUps: ctx.noteCountsByUser.get(m.id) ?? 0,
      });
    });

    rows.sort(
      (a, b) =>
        b.engagement.score - a.engagement.score ||
        a.user.created_at.localeCompare(b.user.created_at),
    );

    return rows;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '@/shared/common/decorators/current-user.decorator';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import {
  buildMemberAnalytics,
  type MemberAnalytics,
} from '../member-analytics';

@Injectable()
export class GetMemberUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string, auth: AuthUser): Promise<MemberAnalytics> {
    const user = await this.users.findById(userId);
    if (!user) fail(404, 'NOT_FOUND', 'المستخدم غير موجود');

    if (auth.role === 'COACH' && user.coachId !== auth.userId) {
      fail(403, 'FORBIDDEN', 'ليس من أعضاء قائمتك');
    }
    if (auth.role === 'USER' && userId !== auth.userId) {
      fail(403, 'FORBIDDEN', 'لا يمكنك مشاهدة ملف عضو آخر');
    }

    const [subs, weights, targets, goals, checkIns, notes, plan] =
      await Promise.all([
        this.stats.allSubscriptions(),
        this.stats.allWeightLogs(),
        this.stats.allWeightTargets(),
        this.stats.allGoals(),
        this.stats.allCheckIns(),
        this.stats.noteCounts(),
        this.stats.mealPlanVersionOf(userId),
      ]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const now = Date.now();
    const yes7 = now - 7 * 86400000;

    const userCheckIns = checkIns.filter((c) => c.userId === userId);

    return buildMemberAnalytics({
      user,
      subscriptionsOf: subs.filter((s) => s.userId === userId),
      weightLogs: weights.filter((w) => w.userId === userId),
      target: targets.find((t) => t.userId === userId) ?? null,
      goal:
        goals
          .filter((g) => g.userId === userId)
          .find((g) => g.mois === currentMonth) ?? null,
      planVersion: plan?.version ?? null,
      checkInCountTotal: userCheckIns.length,
      checkInCount7d: userCheckIns.filter((c) => c.checkedAt.getTime() >= yes7)
        .length,
      followUps: notes.find((n) => n.userId === userId)?.count ?? 0,
    });
  }
}

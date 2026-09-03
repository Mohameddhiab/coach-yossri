import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import {
  GOAL_REPOSITORY,
  type GoalRepository,
} from '@/shared/domain/ports/goal-repository.port';

@Controller('challenge')
@UseGuards(JwtAuthGuard)
export class ChallengeController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(GOAL_REPOSITORY) private readonly goals: GoalRepository,
  ) {}

  @Get('leaderboard')
  async leaderboard(
    @CurrentUser() auth: AuthUser,
    @Query('period') period?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const windowDays = period === '30' ? 30 : period === 'all' ? 0 : 7;
    const limit = Math.max(1, Math.min(100, Number(limitRaw) || 10));
    const since = windowDays === 0 ? 0 : Date.now() - windowDays * 86400000;

    const allUsers = await this.users.listByRole();
    const rows = allUsers.map((u) => ({
      user_id: u.id,
      count: 0,
      streak: 0,
      dates: [] as string[],
      prenom: u.prenom,
      nom: u.nom,
      avatarUrl: u.avatarUrl ?? null,
      dateDebut: u.createdAt,
    }));

    const detailed = await this.goals.recentCheckinsDetailed(since);
    const byUser = new Map(
      detailed.map((c) => [c.userId, { count: c.count, dates: c.dates, streak: c.streak }]),
    );

    const ranked = rows
      .map((r) => {
        const d = byUser.get(r.user_id);
        return { ...r, count: d?.count ?? 0, streak: d?.streak ?? 0, dates: d?.dates ?? [] };
      })
      .sort(
        (a, b) =>
          b.count - a.count || a.dateDebut.getTime() - b.dateDebut.getTime(),
      );

    const myIndex = ranked.findIndex((r) => r.user_id === auth.userId);
    const my_rank =
      myIndex >= 0
        ? {
            rank: myIndex + 1,
            count: ranked[myIndex]?.count ?? 0,
            streak: ranked[myIndex]?.streak ?? 0,
            included: myIndex < limit,
          }
        : null;

    const maxCount = ranked.length > 0 ? ranked[0].count : 1;

    const top = ranked.slice(0, limit);
    if (auth.role === 'USER') {
      return {
        period: windowDays === 0 ? 'all' : `${windowDays}`,
        my_rank,
        max_count: maxCount,
        top: top.map((r) => ({
          count: r.count,
          streak: r.streak,
          checkin_dates: r.dates,
          avatar_url: r.avatarUrl,
          pct: maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0,
          pseudo:
            r.user_id === auth.userId
              ? 'أنت'
              : `${r.prenom.charAt(0)}. ${r.nom.charAt(0)}.`,
        })),
      };
    }
    return {
      period: windowDays === 0 ? 'all' : `${windowDays}`,
      my_rank,
      max_count: maxCount,
      top: top.map((r) => ({
        count: r.count,
        streak: r.streak,
        checkin_dates: r.dates,
        pseudo: `${r.prenom} ${r.nom}`,
        avatar_url: r.avatarUrl,
        pct: maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0,
        user_id: r.user_id,
      })),
    };
  }
}

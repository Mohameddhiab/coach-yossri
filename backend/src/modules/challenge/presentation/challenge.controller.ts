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
      prenom: u.prenom,
      nom: u.nom,
      dateDebut: u.createdAt,
    }));

    const checkins = await this.goals.recentCheckins(since);
    const byUser = new Map(checkins.map((c) => [c.userId, c.count]));

    const ranked = rows
      .map((r) => ({ ...r, count: byUser.get(r.user_id) ?? 0 }))
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
            included: myIndex < limit,
          }
        : null;

    const top = ranked.slice(0, limit);
    if (auth.role === 'USER') {
      return {
        period: windowDays === 0 ? 'all' : `${windowDays}`,
        my_rank,
        top: top.map((r) => ({
          count: r.count,
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
      top: top.map((r) => ({
        count: r.count,
        pseudo: `${r.prenom} ${r.nom}`,
        user_id: r.user_id,
      })),
    };
  }
}

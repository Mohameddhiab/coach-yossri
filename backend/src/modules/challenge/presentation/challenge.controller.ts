import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { GOAL_REPOSITORY, type GoalRepository } from "@/shared/domain/ports/goal-repository.port";

@Controller("challenge")
@UseGuards(JwtAuthGuard)
export class ChallengeController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(GOAL_REPOSITORY) private readonly goals: GoalRepository,
  ) {}

  @Get("leaderboard")
  async leaderboard(@CurrentUser() auth: AuthUser) {
    const weekAgo = Date.now() - 7 * 86400000;
    const allUsers = await this.users.listByRole("USER");
    const rows = allUsers
      .filter((u) => u.role === "USER")
      .map((u) => {
        const count = 0;
        return { user_id: u.id, count, prenom: u.prenom, nom: u.nom };
      });
    const checkins = await this.goals.recentCheckins(weekAgo);
    const byUser = new Map(checkins.map((c) => [c.userId, c.count]));
    const ranked = rows
      .map((r) => ({ ...r, count: byUser.get(r.user_id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    if (auth.role === "USER") {
      return ranked.map((r) => ({
        count: r.count,
        pseudo: r.user_id === auth.userId ? "أنت" : `${r.prenom.charAt(0)}. ${r.nom.charAt(0)}.`,
      }));
    }
    return ranked.map((r) => ({ count: r.count, pseudo: `${r.prenom} ${r.nom}`, user_id: r.user_id }));
  }
}
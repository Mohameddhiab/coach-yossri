import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import { GOAL_REPOSITORY, type GoalRepository } from "@/shared/domain/ports/goal-repository.port";

@Injectable()
export class GetGoalUseCase {
  constructor(@Inject(GOAL_REPOSITORY) private readonly goals: GoalRepository) {}

  async execute(userId: string, mois: string) {
    const goal = await this.goals.ofMonth(userId, mois);
    if (!goal) {
      fail(404, "NO_GOAL", "لا يوجد هدف لهذا الشهر");
    }
    return goal;
  }
}
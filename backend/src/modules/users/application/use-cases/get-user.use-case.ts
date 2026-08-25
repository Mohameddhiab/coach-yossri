import { Inject, Injectable } from "@nestjs/common";
import type { AuthUser } from "@/shared/common/decorators/current-user.decorator";
import { fail } from "@/shared/common/errors/domain-exception";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { SUBSCRIPTION_REPOSITORY, type SubscriptionRepository } from "@/shared/domain/ports/subscription-repository.port";
import { PROGRESS_REPOSITORY, type ProgressRepository } from "@/shared/domain/ports/progress-repository.port";
import { COACH_REPOSITORY, type CoachRepository } from "@/shared/domain/ports/coach-repository.port";
import { MEAL_PLAN_REPOSITORY, type MealPlanRepository } from "@/shared/domain/ports/meal-plan-repository.port";
import { toUserApi } from "@/shared/mapping/user.mapper";
import { toUserWithSubscriptionApi } from "@/shared/mapping/api.mapper";

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: SubscriptionRepository,
    @Inject(PROGRESS_REPOSITORY) private readonly progress: ProgressRepository,
    @Inject(COACH_REPOSITORY) private readonly coach: CoachRepository,
    @Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository,
  ) {}

  async execute(auth: AuthUser, userId: string) {
    const resolvedId = userId === "me" ? auth.userId : userId;
    if (auth.role === "USER" && resolvedId !== auth.userId) {
      fail(403, "FORBIDDEN", "غير مصرح به");
    }
    const user = await this.users.findById(resolvedId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const [subscription, lastWeight, plan, notes] = await Promise.all([
      this.subs.latest(user.id),
      this.progress.lastWeight(user.id),
      this.plans.findActive(user.id),
      this.coach.notesOf(user.id),
    ]);
    return toUserWithSubscriptionApi({
      user: toUserApi(user),
      subscription,
      lastWeight,
      planVersion: plan ? plan.version : null,
      notesCount: notes.length,
    });
  }
}
import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  GOAL_REPOSITORY,
  type GoalRepository,
} from '@/shared/domain/ports/goal-repository.port';

@Injectable()
export class CheckinGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goals: GoalRepository,
  ) {}

  async execute(userId: string, mois: string) {
    const goal = await this.goals.ofMonth(userId, mois);
    if (!goal) {
      fail(404, 'NO_GOAL', 'لا يوجد هدف لهذا الشهر');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (goal.checkins.includes(today)) {
      fail(400, 'ALREADY_CHECKED', 'تم التسجيل اليوم بالفعل');
    }
    return this.goals.checkin(userId, mois, new Date());
  }
}

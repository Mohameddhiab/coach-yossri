import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  GOAL_REPOSITORY,
  type GoalRepository,
} from '@/shared/domain/ports/goal-repository.port';

@Injectable()
export class SetGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goals: GoalRepository,
  ) {}

  async execute(userId: string, mois: string, titre: string, cible: number) {
    if (!titre.trim()) {
      fail(400, 'VALIDATION', 'الهدف مطلوب');
    }
    if (!Number.isFinite(cible) || cible <= 0) {
      fail(400, 'VALIDATION', 'الهدف غير صحيح');
    }
    return this.goals.replace(userId, mois, titre.trim(), cible);
  }
}

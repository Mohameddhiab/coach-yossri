import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from '@/shared/domain/ports/subscription-repository.port';
import {
  PROGRESS_REPOSITORY,
  type ProgressRepository,
} from '@/shared/domain/ports/progress-repository.port';
import {
  COACH_REPOSITORY,
  type CoachRepository,
} from '@/shared/domain/ports/coach-repository.port';
import {
  MEAL_PLAN_REPOSITORY,
  type MealPlanRepository,
} from '@/shared/domain/ports/meal-plan-repository.port';
import { getSubscriptionStatus } from '@/shared/domain/subscription-status';
import { toUserApi } from '@/shared/mapping/user.mapper';
import { toUserWithSubscriptionApi } from '@/shared/mapping/api.mapper';

export type UserStatusFilter = 'TOUS' | 'ACTIF' | 'EXPIRE' | 'EXPIRE_BIENTOT';

@Injectable()
export class ListCoachUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subs: SubscriptionRepository,
    @Inject(PROGRESS_REPOSITORY) private readonly progress: ProgressRepository,
    @Inject(COACH_REPOSITORY) private readonly coach: CoachRepository,
    @Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository,
  ) {}

  async execute(search: string, status: UserStatusFilter) {
    const rawUsers = await this.users.listByRole('USER');
    const query = search.trim().toLowerCase();

    const enriched = await Promise.all(
      rawUsers.map(async (u) => {
        const [subscription, lastWeight, plan, notes] = await Promise.all([
          this.subs.latest(u.id),
          this.progress.lastWeight(u.id),
          this.plans.findActive(u.id),
          this.coach.notesOf(u.id),
        ]);
        const api = toUserWithSubscriptionApi({
          user: toUserApi(u),
          subscription,
          lastWeight,
          planVersion: plan ? plan.version : null,
          notesCount: notes.length,
        });
        return { api, u };
      }),
    );

    let rows = enriched;
    if (query) {
      rows = rows.filter(({ u }) =>
        [u.nom, u.prenom, u.email, u.telephone]
          .join(' ')
          .toLowerCase()
          .includes(query),
      );
    }
    if (status !== 'TOUS') {
      rows = rows.filter(({ api }) => {
        const s = getSubscriptionStatus(
          api.subscription
            ? {
                dateDebut: new Date(api.subscription.date_debut),
                dateFin: new Date(api.subscription.date_fin),
                pauseStart: api.subscription.pause_start
                  ? new Date(api.subscription.pause_start)
                  : null,
                pauseDays: api.subscription.pause_days,
              }
            : null,
        );
        return s === status;
      });
    }

    return rows
      .sort(
        (a, b) =>
          new Date(b.u.createdAt).getTime() - new Date(a.u.createdAt).getTime(),
      )
      .map((r) => r.api);
  }
}

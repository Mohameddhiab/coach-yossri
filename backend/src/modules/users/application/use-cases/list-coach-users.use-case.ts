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

export interface ListCoachUsersOptions {
  page?: number;
  page_size?: number;
}

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

  async execute(
    coachId: string,
    search: string,
    status: UserStatusFilter,
    opts: ListCoachUsersOptions = {},
  ) {
    const { page, page_size } = opts;
    const rawUsers = await this.users.listByCoach(coachId);
    const ids = rawUsers.map((u) => u.id);
    const query = search.trim().toLowerCase();

    // Enrichissement en 4 requêtes bornées au lieu de 4×N requêtes
    const [subs, lastWeights, planVersions, noteCounts] = await Promise.all([
      this.subs.latestByUserIds(ids),
      this.progress.lastWeightByUserIds(ids),
      this.plans.activeVersionByUserIds(ids),
      this.coach.noteCountsByUserIds(ids),
    ]);

    const subById = new Map(subs.map((s) => [s.userId, s]));
    const weightById = new Map(lastWeights.map((w) => [w.userId, w]));
    const planById = new Map(planVersions.map((p) => [p.userId, p]));
    const notesById = new Map(noteCounts.map((n) => [n.userId, n.count]));

    const enriched = rawUsers.map((u) => {
      const api = toUserWithSubscriptionApi({
        user: toUserApi(u),
        subscription: subById.get(u.id) ?? null,
        lastWeight: weightById.get(u.id) ?? null,
        planVersion: planById.get(u.id)?.version ?? null,
        notesCount: notesById.get(u.id) ?? 0,
      });
      return { api, u };
    });

    // Compteurs par statut (sur l'effectif complet, indépendant de la recherche)
    const counts: Record<string, number> = {
      TOUS: enriched.length,
      ACTIF: 0,
      EXPIRE_BIENTOT: 0,
      EXPIRE: 0,
    };
    for (const { api } of enriched) {
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
      if (s === 'ACTIF' || s === 'EXPIRE' || s === 'EXPIRE_BIENTOT') {
        counts[s] += 1;
      }
    }

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

    rows.sort(
      (a, b) =>
        new Date(b.u.createdAt).getTime() - new Date(a.u.createdAt).getTime(),
    );

    const total = rows.length;
    let data = rows.map((r) => r.api);

    if (page !== undefined) {
      const pageSize = Math.max(1, Math.min(100, page_size ?? 50));
      const currentPage = Math.max(1, page);
      const offset = (currentPage - 1) * pageSize;
      data = data.slice(offset, offset + pageSize);
      return {
        data,
        counts,
        total,
        page: currentPage,
        page_size: pageSize,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    return data;
  }
}

import type {
  CheckIn,
  MonthlyGoal,
  Subscription,
  WeightLog,
  WeightTarget,
} from '../entities';

export const STATS_REPOSITORY = Symbol('StatsRepository');

export interface CountByUser {
  userId: string;
  count: number;
}

export interface MealPlanVersionRef {
  userId: string;
  version: number;
}

/**
 * Toutes les lectures sont bornées à un sous-ensemble de membres (WHERE userId IN …)
 * au lieu de scanner les tables entières puis filtrer en mémoire.
 */
export interface StatsRepository {
  subscriptionsOf(userIds: string[]): Promise<Subscription[]>;
  weightLogsOf(userIds: string[]): Promise<WeightLog[]>;
  weightTargetsOf(userIds: string[]): Promise<WeightTarget[]>;
  goalsOf(userIds: string[]): Promise<MonthlyGoal[]>;
  checkInsOf(userIds: string[], since?: Date): Promise<CheckIn[]>;
  noteCountsOf(userIds: string[]): Promise<CountByUser[]>;
  mealPlanVersionsOf(userIds: string[]): Promise<MealPlanVersionRef[]>;
}

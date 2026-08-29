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

export interface StatsRepository {
  allSubscriptions(): Promise<Subscription[]>;
  allWeightLogs(): Promise<WeightLog[]>;
  allWeightTargets(): Promise<WeightTarget[]>;
  allGoals(): Promise<MonthlyGoal[]>;
  allCheckIns(): Promise<CheckIn[]>;
  activeMealPlanVersions(): Promise<MealPlanVersionRef[]>;
  noteCounts(): Promise<CountByUser[]>;
  mealPlanVersionOf(userId: string): Promise<{ version: number } | null>;
}

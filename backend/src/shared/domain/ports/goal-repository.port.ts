import type { MonthlyGoal } from '../entities';

export const GOAL_REPOSITORY = Symbol('GoalRepository');

export interface GoalRepository {
  ofMonth(userId: string, mois: string): Promise<MonthlyGoal | null>;
  replace(
    userId: string,
    mois: string,
    titre: string,
    cible: number,
  ): Promise<MonthlyGoal>;
  checkin(userId: string, mois: string, now: Date): Promise<MonthlyGoal>;
  recentCheckins(weekAgo: number): Promise<{ userId: string; count: number }[]>;
}

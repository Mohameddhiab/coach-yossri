import type { Meal, MealPlan, MealPlanVersion } from '../entities';

export const MEAL_PLAN_REPOSITORY = Symbol('MealPlanRepository');

export interface MealPlanWithMeals extends MealPlan {
  meals: Meal[];
}

export interface MealPlanSnapshot {
  id: string;
  userId: string;
  coachId: string;
  titre: string;
  objectif: string;
  caloriesCible: number;
  proteinesG: number;
  glucidesG: number;
  lipidesG: number;
  statut: string;
  version: number;
  meals: {
    jourSemaine: string;
    typeRepas: string;
    description: string;
    calories: number | null;
    proteinesG: number | null;
    glucidesG: number | null;
    lipidesG: number | null;
    alternatives: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealPlanInput {
  userId: string;
  coachId: string;
  titre: string;
  objectif: string;
  caloriesCible: number;
  proteinesG: number;
  glucidesG: number;
  lipidesG: number;
}

export interface MealPlanRepository {
  findActive(userId: string): Promise<MealPlanWithMeals | null>;
  activeVersionByUserIds(
    userIds: string[],
  ): Promise<{ userId: string; version: number }[]>;
  archiveActive(userId: string): Promise<void>;
  create(input: CreateMealPlanInput, meals: Meal[]): Promise<MealPlanWithMeals>;
  updatePlanAndMeals(
    planId: string,
    patch: Partial<CreateMealPlanInput>,
    meals: Meal[],
  ): Promise<MealPlanWithMeals>;
  bumpVersion(planId: string, oldSnapshot: MealPlanSnapshot): Promise<void>;
  findById(id: string): Promise<MealPlanWithMeals | null>;
  templates(): Promise<
    {
      id: string;
      titre: string;
      objectif: string;
      version: number;
      updatedAt: Date;
      userName: string;
      isTemplate: boolean;
    }[]
  >;
  versions(planId: string): Promise<MealPlanVersion[]>;
}

export const MEAL_REPOSITORY = Symbol('MealRepository');

export interface MealRepository {
  upsertMany(planId: string, meals: Meal[]): Promise<void>;
}

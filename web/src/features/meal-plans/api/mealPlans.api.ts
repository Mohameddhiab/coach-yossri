import { apiClient } from "@/shared/lib/api-client";
import type { ActiviteLevel, Meal, MealPlan, MealPlanVersion, PlanObjective } from "@/shared/lib/domain";

export type MealInput = Omit<Meal, "id" | "meal_plan_id">;

export interface PlanInput {
  titre: string;
  objectif: PlanObjective;
  calories_cible: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
  meals: MealInput[];
}

export function getPlan(userId: string) {
  return apiClient<MealPlan | null>("GET", `/users/${userId}/plan`);
}

export function createPlan(userId: string, input: PlanInput) {
  return apiClient<MealPlan>("POST", `/users/${userId}/plan`, input);
}

export function updatePlan(userId: string, input: PlanInput) {
  return apiClient<MealPlan>("PUT", `/users/${userId}/plan`, input);
}

export function duplicatePlan(userId: string, sourcePlanId: string) {
  return apiClient<MealPlan>("POST", `/users/${userId}/plan/duplicate`, {
    source_plan_id: sourcePlanId,
  });
}

export interface PlanTemplate {
  id: string;
  titre: string;
  objectif: PlanObjective;
  version: number;
  updated_at: string;
  user_name: string;
  is_template: boolean;
}

export function listTemplates() {
  return apiClient<PlanTemplate[]>("GET", "/plans/templates");
}

export interface CalorieSuggestion {
  calories: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
}

export interface CalorieNeeds {
  sexe: string;
  taille_cm: number;
  age: number;
  poids_kg: number;
  activite: ActiviteLevel;
  bmr: number;
  tdee: number;
  suggestions: Record<PlanObjective, CalorieSuggestion>;
}

export function getCalorieNeeds(userId: string, activite: ActiviteLevel) {
  return apiClient<CalorieNeeds>(
    "GET",
    `/users/${userId}/calorie-needs?activite=${activite}`,
  );
}

export function listPlanVersions(userId: string) {
  return apiClient<MealPlanVersion[]>("GET", `/users/${userId}/plan/versions`);
}
import { apiClient } from "@/shared/lib/api-client";
import type { PlanObjective, WeekDay } from "@/shared/lib/domain";

export interface WorkoutExercise {
  id: string;
  workout_plan_id: string;
  jour_semaine: WeekDay;
  nom: string;
  charge: string | null;
  repetitions: string | null;
  series: string | null;
  tempo: string | null;
  repos: string | null;
  groupe_musculaire: string | null;
  notes: string | null;
  image_url: string | null;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  coach_id: string;
  titre: string;
  objectif: PlanObjective;
  statut: "ACTIF" | "ARCHIVE";
  version: number;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export type WorkoutExerciseInput = Omit<WorkoutExercise, "id" | "workout_plan_id">;

export interface WorkoutPlanInput {
  titre: string;
  objectif: PlanObjective;
  exercises: WorkoutExerciseInput[];
}

export function getWorkoutPlan(userId: string) {
  return apiClient<WorkoutPlan | null>("GET", `/users/${userId}/workout-plan`);
}

export function createWorkoutPlan(userId: string, input: WorkoutPlanInput) {
  return apiClient<WorkoutPlan>("POST", `/users/${userId}/workout-plan`, input);
}

export function updateWorkoutPlan(userId: string, input: WorkoutPlanInput) {
  return apiClient<WorkoutPlan>("PUT", `/users/${userId}/workout-plan`, input);
}

export interface WorkoutPlanTemplate {
  id: string;
  titre: string;
  objectif: PlanObjective;
  version: number;
  updated_at: string;
  user_name: string;
  is_template: boolean;
}

export function listWorkoutTemplates() {
  return apiClient<WorkoutPlanTemplate[]>("GET", "/workout-plan-templates");
}

export function duplicateWorkoutPlan(userId: string, sourcePlanId: string) {
  return apiClient<WorkoutPlan>("POST", `/users/${userId}/workout-plan/duplicate`, {
    source_plan_id: sourcePlanId,
  });
}

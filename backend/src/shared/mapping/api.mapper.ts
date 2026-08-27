import type { Meal, MealPlan, Subscription, WeightLog, WeightTarget } from "../domain/entities";
import { getSubscriptionStatus } from "../domain/subscription-status";
import { toUserApi, type UserApi } from "./user.mapper";

export interface SubscriptionApi {
  id: string;
  user_id: string;
  date_debut: string;
  date_fin: string;
  montant: number;
  tier: string;
  mode_paiement: string;
  statut: string;
  created_by: string;
  created_at: string;
  pause_start: string | null;
  pause_days: number;
}

export function toSubscriptionApi(s: Subscription): SubscriptionApi {
  return {
    id: s.id,
    user_id: s.userId,
    date_debut: s.dateDebut.toISOString(),
    date_fin: s.dateFin.toISOString(),
    montant: s.montant,
    tier: s.tier ?? "ONLINE",
    mode_paiement: s.modePaiement ?? "ESPECE",
    statut: getSubscriptionStatus(s),
    created_by: s.createdBy,
    created_at: s.createdAt.toISOString(),
    pause_start: s.pauseStart ? s.pauseStart.toISOString() : null,
    pause_days: s.pauseDays ?? 0,
  };
}

export interface MealApi {
  id: string;
  meal_plan_id: string;
  jour_semaine: string;
  type_repas: string;
  description: string;
  calories: number | null;
  proteines_g: number | null;
  glucides_g: number | null;
  lipides_g: number | null;
  alternatives: string | null;
}

export function toMealApi(m: Meal): MealApi {
  return {
    id: m.id,
    meal_plan_id: m.mealPlanId,
    jour_semaine: m.jourSemaine,
    type_repas: m.typeRepas,
    description: m.description,
    calories: m.calories,
    proteines_g: m.proteinesG,
    glucides_g: m.glucidesG,
    lipides_g: m.lipidesG,
    alternatives: m.alternatives,
  };
}

export interface MealPlanApi {
  id: string;
  user_id: string;
  coach_id: string;
  titre: string;
  objectif: string;
  calories_cible: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
  statut: string;
  version: number;
  meals: MealApi[];
  versions: { version: number; updated_at: string }[];
  created_at: string;
  updated_at: string;
}

export function toMealPlanApi(plan: MealPlan & { meals: Meal[] }): MealPlanApi {
  return {
    id: plan.id,
    user_id: plan.userId,
    coach_id: plan.coachId,
    titre: plan.titre,
    objectif: plan.objectif,
    calories_cible: plan.caloriesCible,
    proteines_g: plan.proteinesG,
    glucides_g: plan.glucidesG,
    lipides_g: plan.lipidesG,
    statut: plan.statut,
    version: plan.version,
    meals: plan.meals.map(toMealApi),
    versions: [],
    created_at: plan.createdAt.toISOString(),
    updated_at: plan.updatedAt.toISOString(),
  };
}

export interface WeightLogApi {
  id: string;
  user_id: string;
  date: string;
  poids_kg: number;
  note: string | null;
}

export function toWeightLogApi(w: WeightLog): WeightLogApi {
  return {
    id: w.id,
    user_id: w.userId,
    date: w.date.toISOString(),
    poids_kg: w.poidsKg,
    note: w.note,
  };
}

export interface WeightTargetApi {
  poids_kg: number;
  date: string;
}

export function toWeightTargetApi(t: WeightTarget): WeightTargetApi {
  return { poids_kg: t.poidsKg, date: t.date.toISOString() };
}

export interface UserWithSubscriptionApi extends UserApi {
  subscription: SubscriptionApi | null;
  last_weight: WeightLogApi | null;
  days_since_last_weight: number | null;
  plan_version: number | null;
  notes_count: number;
}

export function toUserWithSubscriptionApi(input: {
  user: UserApi;
  subscription: Subscription | null;
  lastWeight: WeightLog | null;
  planVersion: number | null;
  notesCount: number;
}): UserWithSubscriptionApi {
  const days = input.lastWeight
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(input.lastWeight.date).getTime()) / 86400000),
      )
    : null;
  return {
    ...input.user,
    subscription: input.subscription ? toSubscriptionApi(input.subscription) : null,
    last_weight: input.lastWeight ? toWeightLogApi(input.lastWeight) : null,
    days_since_last_weight: days,
    plan_version: input.planVersion,
    notes_count: input.notesCount,
  };
}

export function toUserApiDate(iso: string | null): string | null {
  return iso ?? null;
}

export { toUserApi };
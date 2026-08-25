import { Inject, Injectable } from "@nestjs/common";
import {
  MEAL_PLAN_REPOSITORY,
  type MealPlanRepository,
  type MealPlanWithMeals,
} from "@/shared/domain/ports/meal-plan-repository.port";
import { fail } from "@/shared/common/errors/domain-exception";

@Injectable()
export class GetPlanUseCase {
  constructor(@Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository) {}

  async execute(userId: string): Promise<MealPlanWithMeals | null> {
    return this.plans.findActive(userId);
  }
}

@Injectable()
export class CreatePlanUseCase {
  constructor(
    @Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository,
  ) {}

  async execute(
    coachId: string,
    userId: string,
    input: {
      titre?: string;
      objectif?: string;
      caloriesCible?: number;
      proteinesG?: number;
      glucidesG?: number;
      lipidesG?: number;
      meals: {
        jourSemaine?: string;
        typeRepas?: string;
        description?: string;
        calories?: number | null;
        proteinesG?: number | null;
        glucidesG?: number | null;
        lipidesG?: number | null;
        alternatives?: string | null;
      }[];
    },
  ) {
    const meals = normalizeMeals(input.meals);
    await this.plans.archiveActive(userId);
    return this.plans.create(
      {
        userId,
        coachId,
        titre: String(input.titre ?? "").trim() || "خطة غذائية",
        objectif: (input.objectif as "PRISE_DE_MASSE" | "SECHE" | "MAINTIEN") ?? "PRISE_DE_MASSE",
        caloriesCible: Number(input.caloriesCible ?? 0),
        proteinesG: Number(input.proteinesG ?? 0),
        glucidesG: Number(input.glucidesG ?? 0),
        lipidesG: Number(input.lipidesG ?? 0),
      },
      meals,
    );
  }
}

@Injectable()
export class UpdatePlanUseCase {
  constructor(
    @Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository,
  ) {}

  async execute(
    userId: string,
    input: {
      titre?: string;
      objectif?: string;
      caloriesCible?: number;
      proteinesG?: number;
      glucidesG?: number;
      lipidesG?: number;
      meals: {
        jourSemaine?: string;
        typeRepas?: string;
        description?: string;
        calories?: number | null;
        proteinesG?: number | null;
        glucidesG?: number | null;
        lipidesG?: number | null;
        alternatives?: string | null;
      }[];
    },
  ) {
    const plan = await this.plans.findActive(userId);
    if (!plan) {
      fail(404, "NO_PLAN", "لا توجد خطة نشطة لهذا المستخدم");
    }
    const snapshot = toSnapshot(plan);
    const meals = normalizeMeals(input.meals);
    const updated = await this.plans.updatePlanAndMeals(
      plan.id,
      {
        titre:
          input.titre !== undefined && String(input.titre).trim()
            ? String(input.titre).trim()
            : plan.titre,
        objectif: (input.objectif as "PRISE_DE_MASSE" | "SECHE" | "MAINTIEN") ?? plan.objectif,
        caloriesCible:
          input.caloriesCible !== undefined
            ? Number(input.caloriesCible)
            : plan.caloriesCible,
        proteinesG: input.proteinesG !== undefined ? Number(input.proteinesG) : plan.proteinesG,
        glucidesG: input.glucidesG !== undefined ? Number(input.glucidesG) : plan.glucidesG,
        lipidesG: input.lipidesG !== undefined ? Number(input.lipidesG) : plan.lipidesG,
      },
      meals,
    );
    await this.plans.bumpVersion(plan.id, snapshot);
    return updated;
  }
}

@Injectable()
export class DuplicatePlanUseCase {
  constructor(
    @Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository,
  ) {}

  async execute(coachId: string, userId: string, sourcePlanId: string) {
    const source = await this.plans.findById(sourcePlanId);
    if (!source) {
      fail(404, "NOT_FOUND", "الخطة المصدر غير موجودة");
    }
    await this.plans.archiveActive(userId);
    return this.plans.create(
      {
        userId,
        coachId,
        titre: `نسخة من: ${source.titre}`,
        objectif: source.objectif,
        caloriesCible: source.caloriesCible,
        proteinesG: source.proteinesG,
        glucidesG: source.glucidesG,
        lipidesG: source.lipidesG,
      },
      source.meals,
    );
  }
}

@Injectable()
export class VersionsUseCase {
  constructor(@Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository) {}

  async execute(userId: string) {
    const plan = await this.plans.findActive(userId);
    if (!plan) return [];
    return this.plans.versions(plan.id);
  }
}

export function toSnapshot(
  plan: MealPlanWithMeals,
): import("@/shared/domain/ports/meal-plan-repository.port").MealPlanSnapshot {
  return {
    id: plan.id,
    userId: plan.userId,
    coachId: plan.coachId,
    titre: plan.titre,
    objectif: plan.objectif,
    caloriesCible: plan.caloriesCible,
    proteinesG: plan.proteinesG,
    glucidesG: plan.glucidesG,
    lipidesG: plan.lipidesG,
    statut: plan.statut,
    version: plan.version,
    meals: plan.meals.map((m) => ({
      jourSemaine: m.jourSemaine,
      typeRepas: m.typeRepas,
      description: m.description,
      calories: m.calories,
      proteinesG: m.proteinesG,
      glucidesG: m.glucidesG,
      lipidesG: m.lipidesG,
      alternatives: m.alternatives,
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

const MEAL_TYPES = ["PETIT_DEJ", "DEJEUNER", "DINER", "COLLATION"] as const;
const WEEK_DAYS = ["SAM", "DIM", "LUN", "MAR", "MER", "JEU", "VEN", "TOUS_LES_JOURS"] as const;

export function normalizeMeals(
  input: {
    jourSemaine?: string;
    typeRepas?: string;
    description?: string;
    calories?: number | null;
    proteinesG?: number | null;
    glucidesG?: number | null;
    lipidesG?: number | null;
    alternatives?: string | null;
  }[],
): import("@/shared/domain/entities").Meal[] {
  const todayWeekDay = (): string =>
    ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"][new Date().getDay()];
  if (!Array.isArray(input)) return [];
  const num = (v: number | null | undefined): number | null =>
    typeof v === "number" ? v : v !== null && v !== undefined ? Number(v) : null;
  const seen = new Set<string>();
  const out: import("@/shared/domain/entities").Meal[] = [];
  for (const m of input) {
    if (!m || typeof m.description !== "string" || m.description.trim().length === 0) continue;
    const jour = (WEEK_DAYS as readonly string[]).includes(m.jourSemaine ?? "")
      ? m.jourSemaine!
      : todayWeekDay();
    const type = (MEAL_TYPES as readonly string[]).includes(m.typeRepas ?? "")
      ? m.typeRepas!
      : "DEJEUNER";
    const key = `${jour}|${type}|${String(m.description ?? "").trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `m-${Math.random().toString(36).slice(2, 10)}`,
      mealPlanId: "",
      jourSemaine: jour as import("@/shared/domain/domain-types").WeekDay,
      typeRepas: type as import("@/shared/domain/domain-types").MealType,
      description: String(m.description ?? "").trim(),
      calories: num(m.calories),
      proteinesG: num(m.proteinesG),
      glucidesG: num(m.glucidesG),
      lipidesG: num(m.lipidesG),
      alternatives:
        typeof m.alternatives === "string" && m.alternatives.trim()
          ? m.alternatives.trim()
          : null,
    });
  }
  return out;
}
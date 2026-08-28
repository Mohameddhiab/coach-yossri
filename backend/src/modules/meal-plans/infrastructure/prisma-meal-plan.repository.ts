import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  MEAL_PLAN_REPOSITORY,
  type CreateMealPlanInput,
  type MealPlanRepository,
  type MealPlanSnapshot,
  type MealPlanWithMeals,
} from '@/shared/domain/ports/meal-plan-repository.port';
import type { Meal, MealPlanVersion } from '@/shared/domain/entities';

@Injectable()
export class PrismaMealPlanRepository implements MealPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapPlan(row: {
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
    createdAt: Date;
    updatedAt: Date;
    meals?: unknown[];
  }): MealPlanWithMeals {
    return {
      id: row.id,
      userId: row.userId,
      coachId: row.coachId,
      titre: row.titre,
      objectif: row.objectif as MealPlanWithMeals['objectif'],
      caloriesCible: row.caloriesCible,
      proteinesG: row.proteinesG,
      glucidesG: row.glucidesG,
      lipidesG: row.lipidesG,
      statut: row.statut as MealPlanWithMeals['statut'],
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      meals: Array.isArray(row.meals) ? (row.meals as unknown as Meal[]) : [],
    };
  }

  private mealsSelect = {
    orderBy: [{ jourSemaine: 'asc' as const }, { typeRepas: 'asc' as const }],
  };

  async findActive(userId: string): Promise<MealPlanWithMeals | null> {
    const row = await this.prisma.mealPlan.findFirst({
      where: { userId, statut: 'ACTIF' },
      orderBy: { createdAt: 'desc' },
      include: { meals: this.mealsSelect },
    });
    return row ? this.mapPlan(row) : null;
  }

  async archiveActive(userId: string): Promise<void> {
    await this.prisma.mealPlan.updateMany({
      where: { userId, statut: 'ACTIF' },
      data: { statut: 'ARCHIVE' },
    });
  }

  async create(
    input: CreateMealPlanInput,
    meals: Meal[],
  ): Promise<MealPlanWithMeals> {
    const row = await this.prisma.mealPlan.create({
      data: {
        userId: input.userId,
        coachId: input.coachId,
        titre: input.titre,
        objectif: input.objectif as import('@prisma/client').PlanObjective,
        caloriesCible: input.caloriesCible,
        proteinesG: input.proteinesG,
        glucidesG: input.glucidesG,
        lipidesG: input.lipidesG,
        statut: 'ACTIF',
        version: 1,
        meals: {
          create: meals.map((m) => ({
            jourSemaine: m.jourSemaine,
            typeRepas: m.typeRepas,
            description: m.description,
            calories: m.calories,
            proteinesG: m.proteinesG,
            glucidesG: m.glucidesG,
            lipidesG: m.lipidesG,
            alternatives: m.alternatives,
          })),
        },
      },
      include: { meals: this.mealsSelect },
    });
    return this.mapPlan(row);
  }

  async updatePlanAndMeals(
    planId: string,
    patch: Partial<CreateMealPlanInput>,
    meals: Meal[],
  ): Promise<MealPlanWithMeals> {
    const data = {
      ...(patch.userId !== undefined ? { userId: patch.userId } : {}),
      ...(patch.coachId !== undefined ? { coachId: patch.coachId } : {}),
      ...(patch.titre !== undefined ? { titre: patch.titre } : {}),
      ...(patch.objectif !== undefined
        ? { objectif: patch.objectif as import('@prisma/client').PlanObjective }
        : {}),
      ...(patch.caloriesCible !== undefined
        ? { caloriesCible: patch.caloriesCible }
        : {}),
      ...(patch.proteinesG !== undefined
        ? { proteinesG: patch.proteinesG }
        : {}),
      ...(patch.glucidesG !== undefined ? { glucidesG: patch.glucidesG } : {}),
      ...(patch.lipidesG !== undefined ? { lipidesG: patch.lipidesG } : {}),
    };
    await this.prisma.$transaction([
      this.prisma.mealPlan.update({
        where: { id: planId },
        data: { ...data, updatedAt: new Date() },
      }),
      this.prisma.meal.deleteMany({ where: { mealPlanId: planId } }),
      ...meals.map((m) =>
        this.prisma.meal.create({
          data: {
            mealPlanId: planId,
            jourSemaine: m.jourSemaine,
            typeRepas: m.typeRepas,
            description: m.description,
            calories: m.calories,
            proteinesG: m.proteinesG,
            glucidesG: m.glucidesG,
            lipidesG: m.lipidesG,
            alternatives: m.alternatives,
          },
        }),
      ),
    ]);
    const row = await this.prisma.mealPlan.findUnique({
      where: { id: planId },
      include: { meals: this.mealsSelect },
    });
    return row
      ? this.mapPlan(row)
      : this.mapPlan(
          await this.prisma.mealPlan.findUniqueOrThrow({
            where: { id: planId },
            include: { meals: this.mealsSelect },
          }),
        );
  }

  async bumpVersion(
    planId: string,
    oldSnapshot: MealPlanSnapshot,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mealPlanVersion.create({
        data: {
          planId,
          version: oldSnapshot.version,
          snapshot: JSON.stringify(oldSnapshot),
        },
      }),
      this.prisma.mealPlan.update({
        where: { id: planId },
        data: { version: { increment: 1 }, updatedAt: new Date() },
      }),
    ]);
  }

  async findById(id: string): Promise<MealPlanWithMeals | null> {
    const row = await this.prisma.mealPlan.findUnique({
      where: { id },
      include: { meals: this.mealsSelect },
    });
    return row ? this.mapPlan(row) : null;
  }

  async templates(): Promise<
    {
      id: string;
      titre: string;
      objectif: string;
      version: number;
      updatedAt: Date;
      userName: string;
      isTemplate: boolean;
    }[]
  > {
    const rows = await this.prisma.mealPlan.findMany({
      orderBy: [{ isTemplate: 'desc' }, { updatedAt: 'desc' }],
      include: {
        user: { select: { nom: true, prenom: true } },
        meals: this.mealsSelect,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      titre: r.titre,
      objectif: r.objectif,
      version: r.version,
      updatedAt: r.updatedAt,
      userName: `${r.user.nom} ${r.user.prenom}`,
      isTemplate: r.isTemplate,
    }));
  }

  async versions(planId: string): Promise<MealPlanVersion[]> {
    const rows = await this.prisma.mealPlanVersion.findMany({
      where: { planId },
      orderBy: { version: 'desc' },
    });
    return rows.map((r) => ({
      version: r.version,
      snapshot: JSON.parse(
        typeof r.snapshot === 'string'
          ? r.snapshot
          : JSON.stringify(r.snapshot),
      ) as unknown,
      updatedAt: r.updatedAt,
    }));
  }
}

export const PrismaMealPlanRepositoryProvider = {
  provide: MEAL_PLAN_REPOSITORY,
  useClass: PrismaMealPlanRepository,
};

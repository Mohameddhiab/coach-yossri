import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  WORKOUT_PLAN_REPOSITORY,
  type CreateWorkoutPlanInput,
  type WorkoutPlanRepository,
  type WorkoutPlanSnapshot,
  type WorkoutPlanTemplateRow,
  type WorkoutPlanWithExercises,
} from '@/shared/domain/ports/workout-plan-repository.port';
import type {
  WorkoutExercise,
  WorkoutPlanVersion,
} from '@/shared/domain/entities';

@Injectable()
export class PrismaWorkoutPlanRepository implements WorkoutPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapPlan(row: {
    id: string;
    userId: string;
    coachId: string;
    titre: string;
    objectif: string;
    statut: string;
    isTemplate: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    exercises?: unknown[];
  }): WorkoutPlanWithExercises {
    return {
      id: row.id,
      userId: row.userId,
      coachId: row.coachId,
      titre: row.titre,
      objectif: row.objectif as WorkoutPlanWithExercises['objectif'],
      statut: row.statut as WorkoutPlanWithExercises['statut'],
      isTemplate: row.isTemplate,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      exercises: Array.isArray(row.exercises)
        ? (row.exercises as unknown as WorkoutExercise[])
        : [],
    };
  }

  private exercisesSelect = {
    orderBy: [{ jourSemaine: 'asc' as const }, { nom: 'asc' as const }],
  };

  async findActive(userId: string): Promise<WorkoutPlanWithExercises | null> {
    const row = await this.prisma.workoutPlan.findFirst({
      where: { userId, statut: 'ACTIF' },
      orderBy: { createdAt: 'desc' },
      include: { exercises: this.exercisesSelect },
    });
    return row ? this.mapPlan(row) : null;
  }

  async archiveActive(userId: string): Promise<void> {
    await this.prisma.workoutPlan.updateMany({
      where: { userId, statut: 'ACTIF' },
      data: { statut: 'ARCHIVE' },
    });
  }

  async create(
    input: CreateWorkoutPlanInput,
    exercises: WorkoutExercise[],
  ): Promise<WorkoutPlanWithExercises> {
    const row = await this.prisma.workoutPlan.create({
      data: {
        userId: input.userId,
        coachId: input.coachId,
        titre: input.titre,
        objectif: input.objectif as import('@prisma/client').PlanObjective,
        statut: 'ACTIF',
        version: 1,
        exercises: {
          create: exercises.map((e) => ({
            jourSemaine: e.jourSemaine,
            nom: e.nom,
            charge: e.charge,
            repetitions: e.repetitions,
            series: e.series,
            tempo: e.tempo,
            repos: e.repos,
            groupeMusculaire: e.groupeMusculaire,
            notes: e.notes,
            imageUrl: e.imageUrl,
          })),
        },
      },
      include: { exercises: this.exercisesSelect },
    });
    return this.mapPlan(row);
  }

  async updatePlanAndExercises(
    planId: string,
    patch: Partial<CreateWorkoutPlanInput>,
    exercises: WorkoutExercise[],
  ): Promise<WorkoutPlanWithExercises> {
    const data = {
      ...(patch.titre !== undefined ? { titre: patch.titre } : {}),
      ...(patch.objectif !== undefined
        ? { objectif: patch.objectif as import('@prisma/client').PlanObjective }
        : {}),
    };
    await this.prisma.$transaction([
      this.prisma.workoutPlan.update({
        where: { id: planId },
        data: { ...data, updatedAt: new Date() },
      }),
      this.prisma.workoutExercise.deleteMany({
        where: { workoutPlanId: planId },
      }),
      ...exercises.map((e) =>
        this.prisma.workoutExercise.create({
          data: {
            workoutPlanId: planId,
            jourSemaine: e.jourSemaine,
            nom: e.nom,
            charge: e.charge,
            repetitions: e.repetitions,
            series: e.series,
            tempo: e.tempo,
            repos: e.repos,
            groupeMusculaire: e.groupeMusculaire,
            notes: e.notes,
            imageUrl: e.imageUrl,
          },
        }),
      ),
    ]);
    const row = await this.prisma.workoutPlan.findUniqueOrThrow({
      where: { id: planId },
      include: { exercises: this.exercisesSelect },
    });
    return this.mapPlan(row);
  }

  async bumpVersion(
    planId: string,
    oldSnapshot: WorkoutPlanSnapshot,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.workoutPlanVersion.create({
        data: {
          planId,
          version: oldSnapshot.version,
          snapshot: JSON.stringify(oldSnapshot),
        },
      }),
      this.prisma.workoutPlan.update({
        where: { id: planId },
        data: { version: { increment: 1 }, updatedAt: new Date() },
      }),
    ]);
  }

  async findById(id: string): Promise<WorkoutPlanWithExercises | null> {
    const row = await this.prisma.workoutPlan.findUnique({
      where: { id },
      include: { exercises: this.exercisesSelect },
    });
    return row ? this.mapPlan(row) : null;
  }

  async templates(): Promise<WorkoutPlanTemplateRow[]> {
    const rows = await this.prisma.workoutPlan.findMany({
      orderBy: [{ isTemplate: 'desc' }, { updatedAt: 'desc' }],
      include: { user: { select: { nom: true, prenom: true } } },
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

  async versions(planId: string): Promise<WorkoutPlanVersion[]> {
    const rows = await this.prisma.workoutPlanVersion.findMany({
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

export const PrismaWorkoutPlanRepositoryProvider = {
  provide: WORKOUT_PLAN_REPOSITORY,
  useClass: PrismaWorkoutPlanRepository,
};

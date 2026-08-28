import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  WORKOUT_PLAN_REPOSITORY,
  type CreateWorkoutPlanInput,
  type WorkoutPlanRepository,
  type WorkoutPlanSnapshot,
  type WorkoutPlanWithExercises,
} from '@/shared/domain/ports/workout-plan-repository.port';
import { todayWeekDay } from '@/shared/domain/domain-types';
import type { WorkoutExercise } from '@/shared/domain/entities';

@Injectable()
export class GetWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_PLAN_REPOSITORY)
    private readonly plans: WorkoutPlanRepository,
  ) {}

  async execute(userId: string): Promise<WorkoutPlanWithExercises | null> {
    return this.plans.findActive(userId);
  }
}

type ExerciseInput = {
  jourSemaine?: string;
  nom?: string;
  charge?: string | null;
  repetitions?: string | null;
  series?: string | number | null;
  tempo?: string | null;
  repos?: string | number | null;
  repos_sec?: string | number | null; // legacy
  groupeMusculaire?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  image_url?: string | null; // legacy alias
  groupe_musculaire?: string | null; // legacy
  jour_semaine?: string;
  image_url_legacy?: string | null;
};

@Injectable()
export class CreateWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_PLAN_REPOSITORY)
    private readonly plans: WorkoutPlanRepository,
  ) {}

  async execute(
    coachId: string,
    userId: string,
    input: {
      titre?: string;
      objectif?: string;
      exercises?: ExerciseInput[];
    },
  ) {
    const exercises = normalizeExercises(input.exercises);
    await this.plans.archiveActive(userId);
    const data: CreateWorkoutPlanInput = {
      userId,
      coachId,
      titre: String(input.titre ?? '').trim() || 'خطة تمارين',
      objectif:
        (input.objectif as 'PRISE_DE_MASSE' | 'SECHE' | 'MAINTIEN') ??
        'PRISE_DE_MASSE',
    };
    return this.plans.create(data, exercises);
  }
}

@Injectable()
export class UpdateWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_PLAN_REPOSITORY)
    private readonly plans: WorkoutPlanRepository,
  ) {}

  async execute(
    userId: string,
    input: {
      titre?: string;
      objectif?: string;
      exercises?: ExerciseInput[];
    },
  ) {
    const plan = await this.plans.findActive(userId);
    if (!plan) {
      fail(404, 'NO_PLAN', 'لا توجد خطة تمارين نشطة لهذا المستخدم');
    }
    const snapshot = toWorkoutSnapshot(plan);
    const exercises = normalizeExercises(input.exercises);
    const updated = await this.plans.updatePlanAndExercises(
      plan.id,
      {
        titre:
          input.titre !== undefined && String(input.titre).trim()
            ? String(input.titre).trim()
            : plan.titre,
        objectif: input.objectif ?? plan.objectif,
      },
      exercises,
    );
    await this.plans.bumpVersion(plan.id, snapshot);
    return updated;
  }
}

@Injectable()
export class DuplicateWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_PLAN_REPOSITORY)
    private readonly plans: WorkoutPlanRepository,
  ) {}

  async execute(coachId: string, userId: string, sourcePlanId: string) {
    const source = await this.plans.findById(sourcePlanId);
    if (!source) {
      fail(404, 'NOT_FOUND', 'الخطة المصدر غير موجودة');
    }
    await this.plans.archiveActive(userId);
    return this.plans.create(
      {
        userId,
        coachId,
        titre: `نسخة من: ${source.titre}`,
        objectif: source.objectif,
      },
      source.exercises,
    );
  }
}

@Injectable()
export class WorkoutVersionsUseCase {
  constructor(
    @Inject(WORKOUT_PLAN_REPOSITORY)
    private readonly plans: WorkoutPlanRepository,
  ) {}

  async execute(userId: string) {
    const plan = await this.plans.findActive(userId);
    if (!plan) return [];
    return this.plans.versions(plan.id);
  }
}

export function toWorkoutSnapshot(
  plan: WorkoutPlanWithExercises,
): WorkoutPlanSnapshot {
  return {
    id: plan.id,
    userId: plan.userId,
    coachId: plan.coachId,
    titre: plan.titre,
    objectif: plan.objectif,
    statut: plan.statut,
    version: plan.version,
    exercises: plan.exercises.map((e) => ({
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
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

const WEEK_DAYS = [
  'SAM',
  'DIM',
  'LUN',
  'MAR',
  'MER',
  'JEU',
  'VEN',
  'TOUS_LES_JOURS',
] as const;

export function normalizeExercises(
  input: ExerciseInput[] | undefined,
): WorkoutExercise[] {
  if (!Array.isArray(input)) return [];
  const str = (v: unknown): string | null => {
    if (typeof v === 'string') return v.trim() || null;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return null;
  };
  const seen = new Set<string>();
  const out: WorkoutExercise[] = [];
  for (const raw of input) {
    if (!raw) continue;
    const e = raw as Record<string, unknown>;
    const nom = e.nom ?? e.name;
    if (typeof nom !== 'string' || nom.trim().length === 0) continue;
    const jourRaw = (e.jourSemaine ?? e.jour_semaine ?? e.jour) as
      string | undefined;
    const jour = (WEEK_DAYS as readonly string[]).includes(jourRaw ?? '')
      ? jourRaw!
      : todayWeekDay();
    // legacy: series number → string ; repos_sec number → repos string
    const rawSeries = e.series ?? e.series_legacy;
    const rawRepos = e.repos ?? e.repos_sec ?? e.reposSec;
    const rawImage = e.imageUrl ?? e.image_url ?? e.imageUrl_legacy;
    const charge = str(e.charge);
    const tempo = str(e.tempo);
    const series = str(rawSeries);
    const repos = str(rawRepos);
    const key = `${jour}|${String(nom).trim().toLowerCase()}|${series ?? ''}|${str(e.repetitions) ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `w-${Math.random().toString(36).slice(2, 10)}`,
      workoutPlanId: '',
      jourSemaine: jour as WorkoutExercise['jourSemaine'],
      nom: String(nom).trim(),
      charge,
      repetitions: str(e.repetitions),
      series,
      tempo,
      repos,
      groupeMusculaire: str(e.groupeMusculaire ?? e.groupe_musculaire),
      notes: str(e.notes),
      imageUrl: str(rawImage),
    });
  }
  return out;
}

import type { WorkoutExercise, WorkoutPlan } from "../domain/entities";

export interface WorkoutExerciseApi {
  id: string;
  workout_plan_id: string;
  jour_semaine: string;
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

export function toWorkoutExerciseApi(e: WorkoutExercise): WorkoutExerciseApi {
  return {
    id: e.id,
    workout_plan_id: e.workoutPlanId,
    jour_semaine: e.jourSemaine,
    nom: e.nom,
    charge: e.charge,
    repetitions: e.repetitions,
    series: e.series,
    tempo: e.tempo,
    repos: e.repos,
    groupe_musculaire: e.groupeMusculaire,
    notes: e.notes,
    image_url: e.imageUrl,
  };
}

export interface WorkoutPlanApi {
  id: string;
  user_id: string;
  coach_id: string;
  titre: string;
  objectif: string;
  statut: string;
  version: number;
  exercises: WorkoutExerciseApi[];
  created_at: string;
  updated_at: string;
}

export function toWorkoutPlanApi(
  plan: WorkoutPlan & { exercises: WorkoutExercise[] },
): WorkoutPlanApi {
  return {
    id: plan.id,
    user_id: plan.userId,
    coach_id: plan.coachId,
    titre: plan.titre,
    objectif: plan.objectif,
    statut: plan.statut,
    version: plan.version,
    exercises: plan.exercises.map(toWorkoutExerciseApi),
    created_at: plan.createdAt.toISOString(),
    updated_at: plan.updatedAt.toISOString(),
  };
}

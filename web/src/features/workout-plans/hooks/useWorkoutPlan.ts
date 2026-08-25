import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkoutPlan,
  duplicateWorkoutPlan,
  getWorkoutPlan,
  listWorkoutTemplates,
  updateWorkoutPlan,
  type WorkoutPlanInput,
} from "@/features/workout-plans/api/workoutPlans.api";

export function useWorkoutPlan(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["workout-plan", userId],
    queryFn: () => getWorkoutPlan(userId),
    enabled: !!userId && enabled,
  });
}

export function useWorkoutTemplates() {
  return useQuery({
    queryKey: ["workout-plan-templates"],
    queryFn: listWorkoutTemplates,
  });
}

export function useCreateWorkoutPlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkoutPlanInput) => createWorkoutPlan(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plan", userId] });
      qc.invalidateQueries({ queryKey: ["users", userId] });
      qc.invalidateQueries({ queryKey: ["workout-plan-templates"] });
    },
  });
}

export function useUpdateWorkoutPlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkoutPlanInput) => updateWorkoutPlan(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plan", userId] });
      qc.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
}

export function useDuplicateWorkoutPlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourcePlanId: string) => duplicateWorkoutPlan(userId, sourcePlanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plan", userId] });
      qc.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
}

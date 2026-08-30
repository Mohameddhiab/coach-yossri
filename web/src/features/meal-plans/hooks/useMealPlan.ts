import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPlan,
  duplicatePlan,
  getPlan,
  listPlanVersions,
  listTemplates,
  updatePlan,
  type PlanInput,
} from "@/features/meal-plans/api/mealPlans.api";

export function usePlan(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["plan", userId],
    queryFn: () => getPlan(userId),
    enabled: !!userId && enabled,
  });
}

export function useCreatePlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanInput) => createPlan(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan", userId] });
      // Invalide aussi la vue "me" de l'utilisateur pour qu'il voie immédiatement son nouveau plan
      qc.invalidateQueries({ queryKey: ["plan", "me"] });
      qc.invalidateQueries({ queryKey: ["me", "plan"] });
      qc.invalidateQueries({ queryKey: ["workout-plan", "me"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useUpdatePlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanInput) => updatePlan(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan", userId] });
      qc.invalidateQueries({ queryKey: ["plan", "me"] });
      qc.invalidateQueries({ queryKey: ["me", "plan"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useDuplicatePlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourcePlanId: string) => duplicatePlan(userId, sourcePlanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan", userId] });
      qc.invalidateQueries({ queryKey: ["plan", "me"] });
      qc.invalidateQueries({ queryKey: ["me", "plan"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["plan-templates"],
    queryFn: listTemplates,
  });
}

export function usePlanVersions(userId: string) {
  return useQuery({
    queryKey: ["plan-versions", userId],
    queryFn: () => listPlanVersions(userId),
    enabled: !!userId,
  });
}
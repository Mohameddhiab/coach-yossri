import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { MealPlan } from "@/shared/lib/domain";

export function getPlan(userId: string) {
  return apiClient<MealPlan | null>("GET", `/users/${userId}/plan`);
}

export function usePlan(userId: string) {
  return useQuery({
    queryKey: ["plan", userId],
    queryFn: () => getPlan(userId),
    enabled: !!userId,
  });
}
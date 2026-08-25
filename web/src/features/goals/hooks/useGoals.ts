import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { MonthlyGoal } from "@/shared/lib/domain";

export function getGoal(userId: string) {
  return apiClient<MonthlyGoal | null>("GET", `/users/${userId}/goal`);
}

export function setGoal(userId: string, input: { titre: string; cible: number }) {
  return apiClient<MonthlyGoal>("POST", `/users/${userId}/goal`, input);
}

export function checkinGoal(userId: string) {
  return apiClient<MonthlyGoal>("POST", `/users/${userId}/goal/checkin`);
}

export function useGoal(userId: string) {
  return useQuery({
    queryKey: ["goal", userId],
    queryFn: () => getGoal(userId),
    enabled: !!userId,
  });
}

export function useSetGoal(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { titre: string; cible: number }) => setGoal(userId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal", userId] }),
  });
}

export function useCheckinGoal(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => checkinGoal(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal", userId] }),
  });
}
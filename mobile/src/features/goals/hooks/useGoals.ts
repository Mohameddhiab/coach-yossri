import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { MonthlyGoal } from "@/shared/lib/domain";

export function getGoal(userId: string) {
  return apiClient<MonthlyGoal | null>("GET", `/users/${userId}/goal`);
}

export function checkinGoal(userId: string) {
  return apiClient<MonthlyGoal>("POST", `/users/${userId}/goal/checkin`);
}

export interface ChallengeRow {
  count: number;
  pseudo: string;
}

export function getChallengeLeaderboard() {
  return apiClient<ChallengeRow[]>("GET", "/challenge/leaderboard");
}

export function useGoal(userId: string) {
  return useQuery({
    queryKey: ["goal", userId],
    queryFn: () => getGoal(userId),
    enabled: !!userId,
  });
}

export function useCheckinGoal(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => checkinGoal(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal", userId] });
      qc.invalidateQueries({ queryKey: ["challenge"] });
    },
  });
}

export function useChallengeLeaderboard() {
  return useQuery({
    queryKey: ["challenge"],
    queryFn: getChallengeLeaderboard,
  });
}
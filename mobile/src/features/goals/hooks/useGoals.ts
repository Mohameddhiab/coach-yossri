import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { MonthlyGoal } from "@/shared/lib/domain";

export function getGoal(userId: string) {
  return apiClient<MonthlyGoal | null>("GET", `/users/${userId}/goal`);
}

export function checkinGoal(userId: string) {
  return apiClient<MonthlyGoal>("POST", `/users/${userId}/goal/checkin`);
}

export type LeaderboardPeriod = "7" | "30" | "all";

export interface ChallengeRank {
  count: number;
  pseudo: string;
  user_id?: string;
}

export interface ChallengeLeaderboard {
  period: string;
  my_rank: { rank: number; count: number; included: boolean } | null;
  top: ChallengeRank[];
}

export function getChallengeLeaderboard(period: LeaderboardPeriod = "7") {
  return apiClient<ChallengeLeaderboard>(
    "GET",
    `/challenge/leaderboard?period=${period}`,
  );
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

export function useChallengeLeaderboard(period: LeaderboardPeriod = "7") {
  return useQuery({
    queryKey: ["challenge", period],
    queryFn: () => getChallengeLeaderboard(period),
  });
}
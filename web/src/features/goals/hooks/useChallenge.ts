import { useQuery } from "@tanstack/react-query";
import {
  getChallengeLeaderboard,
  type LeaderboardPeriod,
} from "@/features/users/api/users.api";

export function useChallengeLeaderboard(period: LeaderboardPeriod = "7") {
  return useQuery({
    queryKey: ["challenge", "leaderboard", period],
    queryFn: () => getChallengeLeaderboard(period),
  });
}
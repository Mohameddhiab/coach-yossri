import { useQuery } from "@tanstack/react-query";
import { getChallengeLeaderboard } from "@/features/users/api/users.api";

export function useChallengeLeaderboard() {
  return useQuery({
    queryKey: ["challenge", "leaderboard"],
    queryFn: getChallengeLeaderboard,
  });
}
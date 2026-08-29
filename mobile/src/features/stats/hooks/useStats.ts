import { useQuery } from "@tanstack/react-query";
import { getMyStats } from "@/features/stats/api/stats.api";

export function useMyStats() {
  return useQuery({
    queryKey: ["me", "stats"],
    queryFn: getMyStats,
    staleTime: 60_000,
  });
}
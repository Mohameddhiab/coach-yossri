import { useQuery } from "@tanstack/react-query";
import {
  getAttendance,
  getGrowth,
  getMyStats,
  getRevenue,
  getStatsMember,
  getStatsMembers,
  getSummary,
} from "@/features/stats/api/stats.api";

export function useSummary() {
  return useQuery({
    queryKey: ["stats", "summary"],
    queryFn: getSummary,
    staleTime: 60_000,
  });
}

export function useGrowth(months = 12) {
  return useQuery({
    queryKey: ["stats", "growth", months],
    queryFn: () => getGrowth(months),
    staleTime: 60_000,
  });
}

export function useRevenue(months = 12) {
  return useQuery({
    queryKey: ["stats", "revenue", months],
    queryFn: () => getRevenue(months),
    staleTime: 60_000,
  });
}

export function useAttendance(days = 30, limit = 10) {
  return useQuery({
    queryKey: ["stats", "attendance", days, limit],
    queryFn: () => getAttendance(days, limit),
    staleTime: 60_000,
  });
}

export function useStatsMembers() {
  return useQuery({
    queryKey: ["stats", "members"],
    queryFn: getStatsMembers,
    staleTime: 60_000,
  });
}

export function useStatsMember(userId: string) {
  return useQuery({
    queryKey: ["stats", "member", userId],
    queryFn: () => getStatsMember(userId),
    enabled: !!userId,
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ["me", "stats"],
    queryFn: getMyStats,
    staleTime: 60_000,
  });
}
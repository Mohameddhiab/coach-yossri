import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCheckIn,
  getMyCheckIns,
  getTodayCheckIns,
  resolveMember,
} from "@/features/check-ins/api/check-ins.api";

export function useResolveMember(userId?: string | null) {
  return useQuery({
    queryKey: ["check-ins", "resolve", userId],
    queryFn: () => resolveMember(userId!),
    enabled: !!userId,
  });
}

export function useMyCheckIns() {
  return useQuery({
    queryKey: ["me", "check-ins"],
    queryFn: getMyCheckIns,
  });
}

export function useTodayCheckIns(refreshMs?: number) {
  return useQuery({
    queryKey: ["check-ins", "today"],
    queryFn: getTodayCheckIns,
    refetchInterval: refreshMs,
  });
}

export function useCreateCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => createCheckIn(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["check-ins", "today"] });
      qc.invalidateQueries({ queryKey: ["me", "check-ins"] });
      qc.invalidateQueries({ queryKey: ["check-ins", "resolve"] });
    },
  });
}

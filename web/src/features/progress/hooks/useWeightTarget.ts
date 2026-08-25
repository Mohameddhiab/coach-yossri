import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWeightTarget,
  getWeightTarget,
  setWeightTarget,
} from "@/features/users/api/users.api";
import type { WeightTarget } from "@/shared/lib/insights";

export function useWeightTarget(userId: string) {
  return useQuery({
    queryKey: ["weight-target", userId],
    queryFn: () => getWeightTarget(userId),
    enabled: !!userId,
  });
}

export function useSetWeightTarget(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: WeightTarget) => setWeightTarget(userId, target),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-target", userId] });
    },
  });
}

export function useDeleteWeightTarget(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteWeightTarget(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-target", userId] });
    },
  });
}
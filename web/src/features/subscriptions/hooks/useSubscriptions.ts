import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMySubscription,
  pauseSubscription,
  renewSubscription,
  resumeSubscription,
  type RenewInput,
} from "@/features/subscriptions/api/subscriptions.api";

export function useRenewSubscription(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RenewInput) => renewSubscription(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", userId] });
      qc.invalidateQueries({ queryKey: ["subscriptions", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function usePauseSubscription(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subId: string) => pauseSubscription(userId, subId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", userId] });
      qc.invalidateQueries({ queryKey: ["subscriptions", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResumeSubscription(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subId: string) => resumeSubscription(userId, subId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", userId] });
      qc.invalidateQueries({ queryKey: ["subscriptions", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useMySubscription(enabled = true) {
  return useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
    enabled,
  });
}
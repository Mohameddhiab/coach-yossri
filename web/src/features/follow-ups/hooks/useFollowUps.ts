import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFollowUp,
  deleteFollowUp,
  getMyFollowUps,
  listUserFollowUps,
  type CreateFollowUpInput,
} from "@/features/follow-ups/api/follow-ups.api";

export function useMyFollowUps(enabled = true) {
  return useQuery({
    queryKey: ["me", "follow-ups"],
    queryFn: getMyFollowUps,
    enabled,
  });
}

export function useUserFollowUps(userId: string) {
  return useQuery({
    queryKey: ["follow-ups", userId],
    queryFn: () => listUserFollowUps(userId),
    enabled: !!userId,
  });
}

export function useCreateFollowUp(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFollowUpInput) => createFollowUp(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "follow-ups"] });
      qc.invalidateQueries({ queryKey: ["user-detail", userId] });
    },
  });
}

export function useDeleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFollowUp(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "follow-ups"] });
      qc.invalidateQueries({ queryKey: ["user-detail"] });
    },
  });
}

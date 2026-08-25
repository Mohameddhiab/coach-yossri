import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { NotificationPrefs } from "@/shared/lib/domain";

export function usePrefs() {
  return useQuery({
    queryKey: ["me", "prefs"],
    queryFn: () => apiClient<NotificationPrefs>("GET", "/auth/prefs"),
  });
}

export function useSavePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPrefs) => apiClient("PUT", "/auth/prefs", prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "prefs"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      apiClient("POST", "/auth/change-password", { current, next }),
  });
}
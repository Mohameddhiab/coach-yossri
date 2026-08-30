import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";

export interface CoachShell {
  members: number;
  unread: number;
}

export function useCoachShell(refreshMs = 60000) {
  return useQuery({
    queryKey: ["coach", "shell"],
    queryFn: () => apiClient<CoachShell>("GET", "/coach/shell"),
    refetchInterval: refreshMs,
  });
}
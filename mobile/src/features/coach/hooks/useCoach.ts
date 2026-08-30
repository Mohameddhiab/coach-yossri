import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { ChallengeLeaderboard } from "@/features/goals/hooks/useGoals";
import type {
  CoachNote,
  CoachSettings,
  MonthlyGoal,
  Subscription,
  User,
  UserWithSubscription,
} from "@/shared/lib/domain";

export function useCoachUsers(search?: string, status?: string) {
  return useQuery({
    queryKey: ["coach", "users", search, status],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (status) qs.set("status", status);
      const suffix = qs.size ? `?${qs.toString()}` : "";
      return apiClient<UserWithSubscription[]>("GET", `/users${suffix}`);
    },
  });
}

export function useCoachUser(id: string) {
  return useQuery({
    queryKey: ["coach", "users", id],
    queryFn: () => apiClient<UserWithSubscription>("GET", `/users/${id}`),
  });
}

export interface CreateUserPayload {
  email: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  referred_by?: string | null;
  essai?: boolean;
  date_debut?: string;
  date_fin?: string;
  montant?: number;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiClient<{ user: User; password: string }>("POST", "/users", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
      qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<User, "prenom" | "nom" | "telephone" | "date_naissance">>;
    }) => apiClient<User>("PATCH", `/users/${id}`, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.id] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient("DELETE", `/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
      qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
    },
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient<{ password: string }>("POST", `/users/${id}/reset-password`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", id] });
    },
  });
}

export function useResendVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient<{ ok: boolean }>("POST", `/users/${id}/verify-email/resend`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", id] });
    },
  });
}

export function useCoachNotes(userId: string) {
  return useQuery({
    queryKey: ["coach", "users", userId, "notes"],
    queryFn: () => apiClient<CoachNote[]>("GET", `/users/${userId}/notes`),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, contenu }: { userId: string; contenu: string }) =>
      apiClient<CoachNote>("POST", `/users/${userId}/notes`, { contenu }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId, "notes"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, noteId }: { userId: string; noteId: string }) =>
      apiClient("DELETE", `/notes/${noteId}`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId, "notes"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
    },
  });
}

export function useUserSubscriptions(userId: string) {
  return useQuery({
    queryKey: ["coach", "users", userId, "subscriptions"],
    queryFn: () => apiClient<Subscription[]>("GET", `/users/${userId}/subscriptions`),
  });
}

export interface AddSubscriptionPayload {
  essai?: boolean;
  date_debut?: string;
  date_fin?: string;
  montant?: number;
}

export function useAddSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AddSubscriptionPayload }) =>
      apiClient<Subscription>("POST", `/users/${userId}/subscriptions`, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId, "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
      qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
    },
  });
}

export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, subId }: { userId: string; subId: string }) =>
      apiClient<Subscription>("POST", `/users/${userId}/subscriptions/${subId}/pause`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId, "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
      qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
    },
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, subId }: { userId: string; subId: string }) =>
      apiClient<Subscription>("POST", `/users/${userId}/subscriptions/${subId}/resume`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId, "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
      qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
    },
  });
}

export function useSetGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, titre, cible }: { userId: string; titre: string; cible: number }) =>
      apiClient<MonthlyGoal>("POST", `/users/${userId}/goal`, { titre, cible }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId] });
      qc.invalidateQueries({ queryKey: ["coach", "users", vars.userId, "goal"] });
      qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
    },
  });
}

export function useUserGoal(userId: string) {
  return useQuery({
    queryKey: ["coach", "users", userId, "goal"],
    queryFn: () => apiClient<MonthlyGoal | null>("GET", `/users/${userId}/goal`),
  });
}

export function useCoachCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient<MonthlyGoal>("POST", `/users/${userId}/goal/checkin`),
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ["coach", "users", userId, "goal"] });
      qc.invalidateQueries({ queryKey: ["challenge", "leaderboard"] });
    },
  });
}

export function useCoachSettings() {
  return useQuery({
    queryKey: ["coach", "settings"],
    queryFn: () => apiClient<CoachSettings>("GET", "/coach/settings"),
  });
}

export function useSaveCoachSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CoachSettings>) => apiClient<CoachSettings>("PUT", "/coach/settings", patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach", "settings"] });
    },
  });
}

export function useCoachLeaderboard() {
  return useQuery({
    queryKey: ["challenge", "leaderboard"],
    queryFn: () =>
      apiClient<ChallengeLeaderboard>(
        "GET",
        "/challenge/leaderboard?period=7",
      ),
  });
}
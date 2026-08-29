import { apiClient } from "@/shared/lib/api-client";
import type { CoachNote, SubscriptionStatus, User, UserWithSubscription } from "@/shared/lib/domain";
import type { WeightTarget } from "@/shared/lib/insights";

export interface CreateUserInput {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  date_naissance?: string | null;
  tier?: string;
  date_debut?: string;
  date_fin?: string;
  montant?: number;
  referred_by?: string | null;
}

export function listUsers(search: string, status: SubscriptionStatus | "TOUS") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status !== "TOUS") params.set("status", status);
  const qs = params.toString();
  return apiClient<UserWithSubscription[]>("GET", `/users${qs ? `?${qs}` : ""}`);
}

export function getUser(id: string) {
  return apiClient<UserWithSubscription>("GET", `/users/${id}`);
}

export function createUser(input: CreateUserInput) {
  return apiClient<{ user: User; password: string }>("POST", "/users", input);
}

export function updateUser(
  id: string,
  input: Partial<
    Pick<User, "prenom" | "nom" | "telephone" | "date_naissance" | "sexe" | "taille_cm">
  >,
) {
  return apiClient<User>("PATCH", `/users/${id}`, input);
}

export function deleteUser(id: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/users/${id}`);
}

export function resetPassword(id: string) {
  return apiClient<{ password: string }>("POST", `/users/${id}/reset-password`);
}

export function listNotes(userId: string) {
  return apiClient<CoachNote[]>("GET", `/users/${userId}/notes`);
}

export function addNote(userId: string, contenu: string) {
  return apiClient<CoachNote>("POST", `/users/${userId}/notes`, { contenu });
}

export function deleteNote(noteId: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/notes/${noteId}`);
}

export function getWeightTarget(userId: string) {
  return apiClient<WeightTarget | null>("GET", `/users/${userId}/weight-target`);
}

export function setWeightTarget(userId: string, target: WeightTarget) {
  return apiClient<WeightTarget>("PUT", `/users/${userId}/weight-target`, target);
}

export function deleteWeightTarget(userId: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/users/${userId}/weight-target`);
}

export type LeaderboardPeriod = "7" | "30" | "all";

export interface ChallengeRank {
  count: number;
  pseudo: string;
  user_id?: string;
}

export interface ChallengeLeaderboard {
  period: string;
  my_rank: { rank: number; count: number; included: boolean } | null;
  top: ChallengeRank[];
}

export function getChallengeLeaderboard(period: LeaderboardPeriod = "7") {
  return apiClient<ChallengeLeaderboard>(
    "GET",
    `/challenge/leaderboard?period=${period}`,
  );
}
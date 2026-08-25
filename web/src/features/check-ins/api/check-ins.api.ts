import { apiClient } from "@/shared/lib/api-client";

export interface ResolveMember {
  id: string;
  nom: string;
  prenom: string;
  tier: "BASIC" | "PREMIUM" | "ELITE" | null;
  statut: "ACTIF" | "EXPIRE" | "EXPIRE_BIENTOT" | "ESSAI";
  date_fin: string | null;
}

export interface CheckInRow {
  id: string;
  checked_at: string;
}

export interface TodayCheckIn {
  id: string;
  user_id: string;
  user_name: string;
  checked_at: string;
}

export function resolveMember(userId: string) {
  return apiClient<ResolveMember>("GET", `/check-ins/resolve/${userId}`);
}

export function createCheckIn(userId: string) {
  return apiClient<{ id: string }>("POST", `/users/${userId}/check-ins`);
}

export function getMyCheckIns() {
  return apiClient<CheckInRow[]>("GET", "/me/check-ins");
}

export function getTodayCheckIns() {
  return apiClient<TodayCheckIn[]>("GET", "/check-ins/today");
}

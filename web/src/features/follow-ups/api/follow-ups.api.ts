import { apiClient } from "@/shared/lib/api-client";

export interface FollowUp {
  id: string;
  user_id: string;
  coach_id: string;
  coach_name: string;
  periode: string;
  bilan: string;
  ajustements: string | null;
  created_at: string;
}

export interface CreateFollowUpInput {
  periode: string;
  bilan: string;
  ajustements?: string | null;
}

export function getMyFollowUps() {
  return apiClient<FollowUp[]>("GET", "/me/follow-ups");
}

export function listUserFollowUps(userId: string) {
  return apiClient<FollowUp[]>("GET", `/users/${userId}/follow-ups`);
}

export function createFollowUp(userId: string, input: CreateFollowUpInput) {
  return apiClient<FollowUp>("POST", `/users/${userId}/follow-ups`, input);
}

export function deleteFollowUp(id: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/follow-ups/${id}`);
}

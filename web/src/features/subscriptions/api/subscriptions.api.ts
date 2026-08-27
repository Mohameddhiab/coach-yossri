import { apiClient } from "@/shared/lib/api-client";
import type { Subscription, User } from "@/shared/lib/domain";

export interface RenewInput {
  date_debut: string;
  date_fin: string;
  montant: number;
  tier?: string;
}

export function listSubscriptions(userId: string) {
  return apiClient<Subscription[]>("GET", `/users/${userId}/subscriptions`);
}

export function renewSubscription(userId: string, input: RenewInput) {
  return apiClient<Subscription>("POST", `/users/${userId}/subscriptions`, input);
}

export function pauseSubscription(userId: string, subId: string) {
  return apiClient<Subscription>("POST", `/users/${userId}/subscriptions/${subId}/pause`);
}

export function resumeSubscription(userId: string, subId: string) {
  return apiClient<Subscription>("POST", `/users/${userId}/subscriptions/${subId}/resume`);
}

export interface MySubscription {
  subscription: Subscription | null;
  history: Subscription[];
  user: User;
  coach: User | null;
}

export function getMySubscription() {
  return apiClient<MySubscription>("GET", "/me/subscription");
}
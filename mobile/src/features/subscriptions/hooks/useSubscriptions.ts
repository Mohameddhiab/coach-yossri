import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { Subscription, User } from "@/shared/lib/domain";

export interface MySubscription {
  subscription: Subscription | null;
  history: Subscription[];
  user: User;
  coach: User | null;
}

export function getMySubscription() {
  return apiClient<MySubscription>("GET", "/me/subscription");
}

export function useMySubscription() {
  return useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });
}
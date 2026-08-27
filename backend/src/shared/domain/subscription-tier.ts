import type { SubscriptionTier } from "./domain-types";
import { getSubscriptionStatus } from "./subscription-status";

export interface SubscriptionLike {
  dateFin: Date;
  dateDebut: Date;
  pauseStart: Date | null;
  pauseDays?: number | null;
  statut?: string;
  modePaiement?: string;
  tier?: string | null;
}

export type TierFeature = "meal-plan" | "workout-plan" | "chat" | "follow-up";

export const TIER_RANK: Record<SubscriptionTier, number> = {
  ONLINE: 1,
  PREMIUM_COACH: 2,
};

export const OFFRES: Record<
  SubscriptionTier,
  { prix: number; nom: string; features: string[] }
> = {
  ONLINE: {
    prix: 60,
    nom: "Online",
    features: ["Plan alimentaire", "Plan d\'exercices"],
  },
  PREMIUM_COACH: {
    prix: 150,
    nom: "Premium Coach",
    features: [
      "Plan alimentaire",
      "Plan d\'exercices",
      "Suivi personnalisé",
      "Chat direct avec le coach",
    ],
  },
};

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return value === "ONLINE" || value === "PREMIUM_COACH";
}

export function getActiveTier(sub: SubscriptionLike | null): SubscriptionTier | null {
  if (!sub) return null;
  if (getSubscriptionStatus(sub) === "EXPIRE") {
    return null;
  }
  return isSubscriptionTier(sub.tier) ? sub.tier : "ONLINE";
}

const FEATURE_MIN_TIER: Record<TierFeature, SubscriptionTier> = {
  "meal-plan": "ONLINE",
  "workout-plan": "ONLINE",
  chat: "PREMIUM_COACH",
  "follow-up": "PREMIUM_COACH",
};

export function tierAllows(tier: SubscriptionTier | null, feature: TierFeature): boolean {
  if (!tier) return false;
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

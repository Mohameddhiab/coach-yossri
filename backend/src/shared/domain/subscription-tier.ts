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
  BASIC: 1,
  PREMIUM: 2,
  ELITE: 3,
};

export const OFFRES: Record<
  SubscriptionTier,
  { prix: number; nom: string; features: string[] }
> = {
  BASIC: {
    prix: 30,
    nom: "Basic",
    features: ["Accès salle", "Pointage QR"],
  },
  PREMIUM: {
    prix: 50,
    nom: "Premium",
    features: ["Accès salle + pointage", "Plan alimentaire", "Plan d'exercices"],
  },
  ELITE: {
    prix: 90,
    nom: "Elite",
    features: [
      "Accès salle + pointage",
      "Plan alimentaire",
      "Plan d'exercices",
      "Suivi personnalisé",
      "Chat direct avec le coach",
    ],
  },
};

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return value === "BASIC" || value === "PREMIUM" || value === "ELITE";
}

export function getActiveTier(sub: SubscriptionLike | null): SubscriptionTier | null {
  if (!sub) return null;
  if (getSubscriptionStatus(sub) === "EXPIRE") {
    return null;
  }
  return isSubscriptionTier(sub.tier) ? sub.tier : "BASIC";
}

const FEATURE_MIN_TIER: Record<TierFeature, SubscriptionTier> = {
  "meal-plan": "PREMIUM",
  "workout-plan": "PREMIUM",
  chat: "ELITE",
  "follow-up": "ELITE",
};

export function tierAllows(tier: SubscriptionTier | null, feature: TierFeature): boolean {
  if (!tier) return false;
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

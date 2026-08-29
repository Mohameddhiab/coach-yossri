import { apiClient } from "@/shared/lib/api-client";
import type { WeightProjection } from "@/shared/lib/insights";

export type MemberStatut = "ACTIF" | "EXPIRE_BIENTOT" | "EXPIRE" | "AUCUN";

export interface MemberStatsWeight {
  first_kg: number | null;
  last_kg: number | null;
  delta_kg: number | null;
  logs_count: number;
  days_since_last_weight: number | null;
  target: { poids_kg: number; date: string } | null;
  target_progress: number;
  projection: WeightProjection | null;
  eta: { date: string; days: number } | null;
}

export interface MemberStatsGoal {
  titre: string | null;
  cible: number;
  done: number;
  percent: number;
  current_streak: number;
  max_streak: number;
  checked_today: boolean;
}

export interface MemberStatsXpLevel {
  index: number;
  label: string;
  minXp: number;
}

export interface MemberStatsXp {
  xp: number;
  level: MemberStatsXpLevel;
  next: MemberStatsXpLevel | null;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
}

export interface MemberStatsBadge {
  badge: { id: string; label: string; description: string };
  unlocked: boolean;
}

export interface MemberStats {
  user_id: string;
  statut: MemberStatut;
  days_left: number;
  membership_months: number;
  weight: MemberStatsWeight;
  goal: MemberStatsGoal;
  fidelity: {
    months: number;
    renewals: number;
    level: string | null;
    monthsToNext: number | null;
    nextLevel: string | null;
  };
  xp: MemberStatsXp;
  badges: MemberStatsBadge[];
  engaged_badges: string[];
  engagement: { score: number; label: string; color: string };
  checkins: { total: number; last_7d: number };
  follow_ups: number;
}

export function getMyStats() {
  return apiClient<MemberStats>("GET", "/stats/me");
}
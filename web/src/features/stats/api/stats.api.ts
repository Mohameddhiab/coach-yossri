import { apiClient } from "@/shared/lib/api-client";
import type { Subscription } from "@/shared/lib/domain";
import type {
  BadgeDef,
  EngagementScore,
  Fidelity,
  WeightProjection,
  XpResult,
} from "@/shared/lib/insights";

export interface StatsSummary {
  total: number;
  actifs: number;
  expirant7j: number;
  expires: number;
  nouveaux_30j: number;
  checkins_7j: number;
  renouvellements: number;
  ratio_renewal: number;
  taux_retention: number;
  revenue_total: number;
  revenue_mensuel: number;
  revenu_moyen_par_membre: number;
  revenu_par_tier: { ONLINE: number; PREMIUM_COACH: number };
  membres_actifs: number;
  tiers: { ONLINE: number; PREMIUM_COACH: number };
  membership_moyen_mois: number;
}

export interface StatsGrowthRow {
  mois: string;
  nouveaux: number;
  cumul: number;
  revenus: number;
  cumul_revenus: number;
  attrition: number;
  actifs_fin: number;
}

export interface StatsRevenueRow {
  mois: string;
  total: number;
  count: number;
  cumul: number;
  par_tier: { ONLINE: number; PREMIUM_COACH: number };
}

export interface StatsAttendanceDay {
  date: string;
  count: number;
}

export interface StatsAttendanceMember {
  user_id: string;
  user: {
    id: string;
    role: string;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
    date_naissance: string | null;
    sexe: string | null;
    taille_cm: number | null;
    coach_id: string | null;
    referred_by: string | null;
    created_at: string;
  };
  count: number;
  ratio: number;
}

export interface StatsAttendance {
  days: number;
  total: number;
  moyenne_par_jour: number;
  par_jour: StatsAttendanceDay[];
  par_membre: StatsAttendanceMember[];
}

export type MemberStatut = "ACTIF" | "EXPIRE_BIENTOT" | "EXPIRE" | "AUCUN";

export interface MemberWeightAnalytics {
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

export interface MemberGoalAnalytics {
  titre: string | null;
  cible: number;
  done: number;
  percent: number;
  current_streak: number;
  max_streak: number;
  checked_today: boolean;
}

export interface MemberBadge {
  badge: BadgeDef;
  unlocked: boolean;
}

export interface MemberAnalytics {
  user_id: string;
  user: {
    id: string;
    role: string;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
    date_naissance: string | null;
    sexe: string | null;
    taille_cm: number | null;
    coach_id: string | null;
    referred_by: string | null;
    created_at: string;
  };
  subscription: Subscription | null;
  statut: MemberStatut;
  days_left: number;
  membership_months: number;
  weight: MemberWeightAnalytics;
  goal: MemberGoalAnalytics;
  fidelity: Fidelity;
  xp: XpResult;
  badges: MemberBadge[];
  engaged_badges: string[];
  engagement: EngagementScore;
  checkins: { total: number; last_7d: number };
  follow_ups: number;
}

export function getSummary() {
  return apiClient<StatsSummary>("GET", "/stats/summary");
}

export function getGrowth(months = 12) {
  return apiClient<StatsGrowthRow[]>("GET", `/stats/growth?months=${months}`);
}

export function getRevenue(months = 12) {
  return apiClient<StatsRevenueRow[]>("GET", `/stats/revenue?months=${months}`);
}

export function getAttendance(days = 30, limit = 10) {
  return apiClient<StatsAttendance>(
    "GET",
    `/stats/attendance?days=${days}&limit=${limit}`,
  );
}

export function getStatsMembers() {
  return apiClient<MemberAnalytics[]>("GET", "/stats/members");
}

export function getStatsMember(userId: string) {
  return apiClient<MemberAnalytics>("GET", `/stats/member/${userId}`);
}

export function getMyStats() {
  return apiClient<MemberAnalytics>("GET", "/stats/me");
}
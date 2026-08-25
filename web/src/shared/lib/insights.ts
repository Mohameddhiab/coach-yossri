import type {
  MonthlyGoal,
  Subscription,
  SubscriptionTier,
  User,
  UserWithSubscription,
  WeightLog,
} from "@/shared/lib/domain";
import {
  daysLeft,
  getActiveTier,
  getSubscriptionStatus,
  isTrial,
} from "@/shared/lib/domain";

export type FidelityLevel = "BRONZE" | "SILVER" | "GOLD";

export interface WeightTarget {
  poids_kg: number;
  date: string;
}

export interface Fidelity {
  months: number;
  renewals: number;
  level: FidelityLevel | null;
  monthsToNext: number | null;
  nextLevel: FidelityLevel | null;
}

const LEVELS: { level: FidelityLevel; minMonths: number; label: string }[] = [
  { level: "GOLD", minMonths: 12, label: "ذهبي" },
  { level: "SILVER", minMonths: 6, label: "فضي" },
  { level: "BRONZE", minMonths: 3, label: "برونزي" },
];

export function computeFidelity(history: Subscription[] | null | undefined): Fidelity {
  if (!history || history.length === 0) {
    return { months: 0, renewals: 0, level: null, monthsToNext: null, nextLevel: null };
  }
  const first = history.reduce((a, b) =>
    new Date(a.date_debut).getTime() < new Date(b.date_debut).getTime() ? a : b,
  );
  const months = Math.max(
    0,
    Math.floor((Date.now() - new Date(first.date_debut).getTime()) / (30 * 86400000)),
  );
  const level = LEVELS.find((l) => months >= l.minMonths)?.level ?? null;
  const next = LEVELS.filter((l) => months < l.minMonths).sort(
    (a, b) => a.minMonths - b.minMonths,
  )[0];
  return {
    months,
    renewals: history.length,
    level,
    monthsToNext: next ? next.minMonths - months : null,
    nextLevel: next?.level ?? null,
  };
}

export const FIDELITY_LABELS: Record<FidelityLevel, string> = {
  BRONZE: "برونزي",
  SILVER: "فضي",
  GOLD: "ذهبي",
};

export interface WeightProjection {
  slopePerWeek: number;
  projected: number;
  daysAhead: number;
  label: string;
}

export function projectWeight(logs: WeightLog[], daysAhead = 28): WeightProjection | null {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  if (sorted.length < 2) return null;

  const base = new Date(sorted[0].date).getTime();
  const points = sorted.map((l) => ({
    x: (new Date(l.date).getTime() - base) / 86400000,
    y: l.poids_kg,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const projected = intercept + slope * (points[n - 1].x + daysAhead);
  const slopePerWeek = slope * 7;

  return {
    slopePerWeek: Math.round(slopePerWeek * 10) / 10,
    projected: Math.round(projected * 10) / 10,
    daysAhead,
    label: `بعد ${daysAhead} يوم`,
  };
}

export interface EstimateTargetDate {
  date: string;
  days: number;
}

export function estimateTargetDate(
  logs: WeightLog[],
  targetPoids: number,
): EstimateTargetDate | null {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  if (sorted.length < 2) return null;

  const base = new Date(sorted[0].date).getTime();
  const points = sorted.map((l) => ({
    x: (new Date(l.date).getTime() - base) / 86400000,
    y: l.poids_kg,
  }));
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  if (Math.abs(slope) < 1e-6) return null;
  const intercept = (sumY - slope * sumX) / n;
  const days = (targetPoids - intercept) / slope;
  if (days <= points[n - 1].x) return null;

  const date = new Date(base + days * 86400000);
  return { date: date.toISOString().slice(0, 10), days: Math.ceil(days) };
}

export function targetProgress(logs: WeightLog[], target: WeightTarget | null): number {
  if (!target || logs.length === 0) return 0;
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const start = sorted[0].poids_kg;
  const current = sorted[sorted.length - 1].poids_kg;
  const total = start - target.poids_kg;
  if (total === 0) return current <= target.poids_kg ? 100 : 0;
  const done = start - current;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

/* ------------------------------ XP & niveaux ------------------------------ */

export interface XpLevel {
  index: number;
  label: string;
  minXp: number;
}

export const XP_LEVELS: XpLevel[] = [
  { index: 0, label: "مبتدئ", minXp: 0 },
  { index: 1, label: "هاوي", minXp: 150 },
  { index: 2, label: "ملتزم", minXp: 400 },
  { index: 3, label: "محترف", minXp: 800 },
  { index: 4, label: "أسطورة", minXp: 1500 },
];

export interface XpResult {
  xp: number;
  level: XpLevel;
  next: XpLevel | null;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
}

export function computeXp(
  weightLogs: WeightLog[],
  goal: MonthlyGoal | null,
  fidelity: Fidelity,
): XpResult {
  const checkins = goal?.checkins?.length ?? 0;
  const goalDone = goal ? checkins >= goal.cible : false;
  const xp =
    weightLogs.length * 10 +
    checkins * 20 +
    (goalDone ? 50 : 0) +
    fidelity.renewals * 25 +
    fidelity.months * 5;

  const level = [...XP_LEVELS].reverse().find((l) => xp >= l.minXp) ?? XP_LEVELS[0];
  const next = XP_LEVELS[level.index + 1] ?? null;
  const xpIntoLevel = xp - level.minXp;
  const xpForNext = next ? next.minXp - level.minXp : 0;
  return {
    xp,
    level,
    next,
    xpIntoLevel,
    xpForNext,
    progress: next ? Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)) : 100,
  };
}

/* -------------------------------- Badges ---------------------------------- */

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: "scale" | "flame" | "trophy" | "star" | "medal" | "calendar" | "target" | "dumbbell";
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: "FIRST_WEIGH", label: "أول وزنة", description: "سجلت وزنك لأول مرة", icon: "scale" },
  { id: "REGULAR_10", label: "المواظب", description: "10 وزنات أو أكثر", icon: "calendar" },
  { id: "LOST_5", label: "ناقص 5 كلغ", description: "خسرت 5 كلغ من البداية", icon: "trophy" },
  { id: "LOST_10", label: "ناقص 10 كلغ", description: "خسرت 10 كلغ من البداية", icon: "medal" },
  { id: "GAINED_5", label: "زاد 5 كلغ", description: "زدت 5 كلغ كتلة", icon: "dumbbell" },
  { id: "STREAK_7", label: "سلسلة 7 أيام", description: "7 أيام متتالية من الحضور", icon: "flame" },
  { id: "STREAK_30", label: "سلسلة 30 يوم", description: "30 يوم متتالي من الحضور", icon: "flame" },
  { id: "GOAL_DONE", label: "تحدي الشهر", description: "أكملت هدف الشهر", icon: "target" },
  { id: "FIDELITY_BRONZE", label: "عضو برونزي", description: "3 أشهر معنا", icon: "star" },
  { id: "FIDELITY_SILVER", label: "عضو فضي", description: "6 أشهر معنا", icon: "star" },
  { id: "FIDELITY_GOLD", label: "عضو ذهبي", description: "سنة كاملة معنا", icon: "medal" },
  { id: "MEMBER_1Y", label: "سنة مع المدرب", description: "أنت معنا من سنة", icon: "calendar" },
];

export interface BadgeResult {
  badge: BadgeDef;
  unlocked: boolean;
}

function maxStreak(checkins: string[]): number {
  const days = [...new Set(checkins.map((c) => c.slice(0, 10)))].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = new Date(d + "T00:00:00Z").getTime();
    if (prev !== null && t - prev === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export function computeBadges(input: {
  user: Pick<User, "created_at">;
  weightLogs: WeightLog[];
  goal: MonthlyGoal | null;
  fidelity: Fidelity;
}): BadgeResult[] {
  const { user, weightLogs, goal, fidelity } = input;
  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const first = sorted[0]?.poids_kg ?? null;
  const last = sorted[sorted.length - 1]?.poids_kg ?? null;
  const lost = first !== null && last !== null ? first - last : 0;
  const streak = maxStreak(goal?.checkins ?? []);
  const goalDone = goal ? (goal.checkins?.length ?? 0) >= goal.cible : false;
  const memberMonths =
    (Date.now() - new Date(user.created_at).getTime()) / (30 * 86400000);

  const flags: Record<string, boolean> = {
    FIRST_WEIGH: weightLogs.length >= 1,
    REGULAR_10: weightLogs.length >= 10,
    LOST_5: lost >= 5,
    LOST_10: lost >= 10,
    GAINED_5: lost <= -5,
    STREAK_7: streak >= 7,
    STREAK_30: streak >= 30,
    GOAL_DONE: goalDone,
    FIDELITY_BRONZE: fidelity.months >= 3,
    FIDELITY_SILVER: fidelity.months >= 6,
    FIDELITY_GOLD: fidelity.months >= 12,
    MEMBER_1Y: memberMonths >= 12,
  };

  return BADGE_DEFS.map((badge) => ({ badge, unlocked: !!flags[badge.id] }));
}

/* --------------------------- Score d'engagement --------------------------- */

export interface EngagementScore {
  score: number;
  label: string;
  color: "green" | "amber" | "red";
}

export function computeEngagement(u: UserWithSubscription): EngagementScore {
  let score = 0;

  const d = u.days_since_last_weight;
  if (d === null) score += 0;
  else if (d <= 3) score += 50;
  else if (d <= 7) score += 35;
  else if (d <= 14) score += 20;
  else score += 5;

  const status = getSubscriptionStatus(u.subscription);
  if (status === "ACTIF") score += 30;
  else if (status === "ESSAI") score += 25;
  else if (status === "EXPIRE_BIENTOT") score += 20;
  else score += 0;

  if (u.plan_version !== null) score += 20;

  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 70 ? "green" : clamped >= 40 ? "amber" : "red";
  const label =
    clamped >= 70 ? "ملتزم" : clamped >= 40 ? "متراجع" : "منقطع";
  return { score: clamped, label, color };
}

/* ------------------------------ Alertes coach ----------------------------- */

export type AlertKind = "expired" | "expiring" | "trial" | "stale";

export interface CoachAlert {
  key: string;
  kind: AlertKind;
  userId: string;
  userName: string;
  title: string;
  description: string;
  badge: string;
}

export const STALE_WEIGHT_DAYS = 14;

export function computeAlerts(users: UserWithSubscription[]): CoachAlert[] {
  const alerts: CoachAlert[] = [];

  for (const user of users) {
    const status = getSubscriptionStatus(user.subscription);
    const remaining = daysLeft(user.subscription);
    const name = `${user.prenom} ${user.nom}`;

    if (status === "EXPIRE") {
      alerts.push({
        key: `expire-${user.id}`,
        kind: "expired",
        userId: user.id,
        userName: name,
        title: `${name} — انتهى اشتراكه`,
        description: "يجب تجديده ليعود إلى القاعة",
        badge: "منتهي",
      });
    } else if (status === "EXPIRE_BIENTOT") {
      alerts.push({
        key: `bientot-${user.id}`,
        kind: "expiring",
        userId: user.id,
        userName: name,
        title: `${name} — ينتهي اشتراكه خلال ${remaining} أيام`,
        description: "ذكّره بالتجديد",
        badge: "أوشك على الانتهاء",
      });
    } else if (isTrial(user.subscription) && remaining <= 3) {
      alerts.push({
        key: `trial-${user.id}`,
        kind: "trial",
        userId: user.id,
        userName: name,
        title: `${name} — الفترة التجريبية تنتهي في ${remaining} أيام`,
        description: "شجعه على الاشتراك الكامل",
        badge: "تجريبي",
      });
    }

    const stale =
      user.days_since_last_weight === null ||
      user.days_since_last_weight >= STALE_WEIGHT_DAYS;
    if (stale && status !== "EXPIRE") {
      alerts.push({
        key: `stale-${user.id}`,
        kind: "stale",
        userId: user.id,
        userName: name,
        title: `${name} — لم يسجل وزنه منذ ${user.days_since_last_weight ?? "?"} يوم`,
        description: "تابع تقدمه",
        badge: "تتبّع",
      });
    }
  }

  return alerts;
}

/* --------------------------- Répartition par tier ------------------------ */

export function tierDistribution(
  users: UserWithSubscription[],
): { tier: SubscriptionTier; count: number; revenue: number }[] {
  const tiers: SubscriptionTier[] = ["ELITE", "PREMIUM", "BASIC"];
  return tiers.map((tier) => {
    const rows = users.filter((u) => getActiveTier(u.subscription) === tier);
    return {
      tier,
      count: rows.length,
      revenue: rows.reduce((sum, u) => sum + (u.subscription?.montant ?? 0), 0),
    };
  });
}

export function payingRevenue(users: UserWithSubscription[]): {
  total: number;
  payers: number;
} {
  const payers = users.filter((u) => {
    const st = getSubscriptionStatus(u.subscription);
    return st === "ACTIF" || st === "ESSAI" || st === "EXPIRE_BIENTOT";
  });
  return {
    total: payers.reduce((sum, u) => sum + (u.subscription?.montant ?? 0), 0),
    payers: payers.length,
  };
}

import type { MonthlyGoal, Subscription } from './entities';
import type { SubscriptionStatus } from './domain-types';
import { getSubscriptionStatus } from './subscription-status';

export type FidelityLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export interface Fidelity {
  months: number;
  renewals: number;
  level: FidelityLevel | null;
  monthsToNext: number | null;
  nextLevel: FidelityLevel | null;
}

const LEVELS: { level: FidelityLevel; minMonths: number }[] = [
  { level: 'GOLD', minMonths: 12 },
  { level: 'SILVER', minMonths: 6 },
  { level: 'BRONZE', minMonths: 3 },
];

export const FIDELITY_LABELS: Record<FidelityLevel, string> = {
  BRONZE: 'برونزي',
  SILVER: 'فضي',
  GOLD: 'ذهبي',
};

/* ------------------------------- dates -------------------------------- */

export function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function monthKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 7);
}

function monthOffsetKey(offset: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 7);
}

/* ------------------------------- streaks ------------------------------ */

export function currentStreak(checkins: string[]): number {
  if (checkins.length === 0) return 0;
  const set = new Set(checkins.map((c) => dayKey(c)));
  let cursor = set.has(todayKey())
    ? new Date()
    : new Date(Date.now() - 86400000);
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

export function isCheckedToday(checkins: string[]): boolean {
  return checkins.some((c) => dayKey(c) === todayKey());
}

export function maxStreak(checkins: string[]): number {
  const days = [...new Set(checkins.map((c) => dayKey(c)))].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = new Date(d + 'T00:00:00Z').getTime();
    if (prev !== null && t - prev === 86400000) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

/* ------------------------------- fidélité ----------------------------- */

export function computeFidelity(
  history: Array<{ dateDebut: Date }> | null | undefined,
): Fidelity {
  if (!history || history.length === 0) {
    return {
      months: 0,
      renewals: 0,
      level: null,
      monthsToNext: null,
      nextLevel: null,
    };
  }
  const first = history.reduce((a, b) =>
    a.dateDebut.getTime() < b.dateDebut.getTime() ? a : b,
  );
  const months = Math.max(
    0,
    Math.floor((Date.now() - first.dateDebut.getTime()) / (30 * 86400000)),
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

/* ------------------------------- poids ------------------------------- */

export interface WeightProjection {
  slopePerWeek: number;
  projected: number;
  daysAhead: number;
}

export interface EstimateResult {
  date: string;
  days: number;
}

export interface WeightLike {
  date: Date;
  poidsKg: number;
}

interface Point {
  x: number;
  y: number;
}

function toPoints(sorted: WeightLike[]): Point[] {
  const base = sorted[0].date.getTime();
  return sorted.map((l) => ({
    x: (l.date.getTime() - base) / 86400000,
    y: l.poidsKg,
  }));
}

export function projectWeight(
  logs: WeightLike[],
  daysAhead = 28,
): WeightProjection | null {
  const sorted = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  if (sorted.length < 2) return null;

  const points = toPoints(sorted);
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
  };
}

export function estimateTargetDate(
  logs: WeightLike[],
  targetKg: number,
): EstimateResult | null {
  const sorted = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  if (sorted.length < 2) return null;

  const points = toPoints(sorted);
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
  const days = (targetKg - intercept) / slope;
  if (days <= points[n - 1].x) return null;

  const date = new Date(sorted[0].date.getTime() + days * 86400000);
  return { date: date.toISOString().slice(0, 10), days: Math.ceil(days) };
}

export function targetProgress(
  logs: WeightLike[],
  target: { poidsKg: number } | null,
): number {
  if (!target || logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const start = sorted[0].poidsKg;
  const current = sorted[sorted.length - 1].poidsKg;
  const total = start - target.poidsKg;
  if (total === 0) return current <= target.poidsKg ? 100 : 0;
  const done = start - current;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

/* ------------------------------ XP & niveaux -------------------------- */

export interface XpLevel {
  index: number;
  label: string;
  minXp: number;
}

export const XP_LEVELS: XpLevel[] = [
  { index: 0, label: 'مبتدئ', minXp: 0 },
  { index: 1, label: 'هاوٍ', minXp: 150 },
  { index: 2, label: 'ملتزم', minXp: 400 },
  { index: 3, label: 'محترف', minXp: 800 },
  { index: 4, label: 'أسطوري', minXp: 1500 },
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
  weightLogs: WeightLike[],
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

  const level =
    [...XP_LEVELS].reverse().find((l) => xp >= l.minXp) ?? XP_LEVELS[0];
  const next = XP_LEVELS[level.index + 1] ?? null;
  const xpIntoLevel = xp - level.minXp;
  const xpForNext = next ? next.minXp - level.minXp : 0;
  return {
    xp,
    level,
    next,
    xpIntoLevel,
    xpForNext,
    progress: next
      ? Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100))
      : 100,
  };
}

/* -------------------------------- badges ------------------------------ */

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon:
    | 'scale'
    | 'flame'
    | 'trophy'
    | 'star'
    | 'medal'
    | 'calendar'
    | 'target'
    | 'dumbbell';
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'FIRST_WEIGH',
    label: 'تسجيل الوزن الأول',
    description: 'سجّلت وزنك لأول مرة',
    icon: 'scale',
  },
  {
    id: 'REGULAR_10',
    label: 'المواظب',
    description: '١٠ تسجيلات وزن أو أكثر',
    icon: 'calendar',
  },
  {
    id: 'LOST_5',
    label: 'فقدان ٥ كغم',
    description: 'فقدت ٥ كغم منذ البداية',
    icon: 'trophy',
  },
  {
    id: 'LOST_10',
    label: 'فقدان ١٠ كغم',
    description: 'فقدت ١٠ كغم منذ البداية',
    icon: 'medal',
  },
  {
    id: 'GAINED_5',
    label: 'زيادة ٥ كغم',
    description: 'اكتسبت ٥ كغم من الكتلة العضلية',
    icon: 'dumbbell',
  },
  {
    id: 'STREAK_7',
    label: 'سلسلة ٧ أيام',
    description: '٧ أيام متتالية من الحضور',
    icon: 'flame',
  },
  {
    id: 'STREAK_30',
    label: 'سلسلة ٣٠ يومًا',
    description: '٣٠ يومًا متتاليًا من الحضور',
    icon: 'flame',
  },
  {
    id: 'GOAL_DONE',
    label: 'تحدّي الشهر',
    description: 'أتممت هدف الشهر بنجاح',
    icon: 'target',
  },
  {
    id: 'FIDELITY_BRONZE',
    label: 'عضو برونزي',
    description: '٣ أشهر من العضوية',
    icon: 'star',
  },
  {
    id: 'FIDELITY_SILVER',
    label: 'عضو فضّي',
    description: '٦ أشهر من العضوية',
    icon: 'star',
  },
  {
    id: 'FIDELITY_GOLD',
    label: 'عضو ذهبي',
    description: 'سنة كاملة من العضوية',
    icon: 'medal',
  },
  {
    id: 'MEMBER_1Y',
    label: 'عام مع المدرب',
    description: 'مضى عام كامل على انضمامك',
    icon: 'calendar',
  },
];

export interface BadgeResult {
  badge: BadgeDef;
  unlocked: boolean;
}

export function computeBadges(input: {
  userCreatedAt: Date;
  weightLogs: WeightLike[];
  goal: MonthlyGoal | null;
  fidelity: Fidelity;
}): BadgeResult[] {
  const { userCreatedAt, weightLogs, goal, fidelity } = input;
  const sorted = [...weightLogs].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const first = sorted[0]?.poidsKg ?? null;
  const last = sorted[sorted.length - 1]?.poidsKg ?? null;
  const lost = first !== null && last !== null ? first - last : 0;
  const streak = maxStreak(goal?.checkins ?? []);
  const goalDone = goal ? (goal.checkins?.length ?? 0) >= goal.cible : false;
  const memberMonths = (Date.now() - userCreatedAt.getTime()) / (30 * 86400000);

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

export function unlockedBadgeIds(badges: BadgeResult[]): string[] {
  return badges.filter((b) => b.unlocked).map((b) => b.badge.id);
}

/* --------------------------- score d'engagement ----------------------- */

export interface EngagementScore {
  score: number;
  label: string;
  color: 'green' | 'amber' | 'red';
}

export interface EngagementInput {
  subscription: {
    dateFin: Date;
    dateDebut: Date;
    pauseStart: Date | null;
    pauseDays?: number | null;
    statut?: string;
    modePaiement?: string;
    tier?: string | null;
  } | null;
  daysSinceLastWeight: number | null;
  planVersion: number | null;
}

export function computeEngagement(input: EngagementInput): EngagementScore {
  let score = 0;

  const d = input.daysSinceLastWeight;
  if (d === null) score += 0;
  else if (d <= 3) score += 50;
  else if (d <= 7) score += 35;
  else if (d <= 14) score += 20;
  else score += 5;

  const status = getSubscriptionStatus(input.subscription);
  if (status === 'ACTIF') score += 30;
  else if (status === 'EXPIRE_BIENTOT') score += 20;
  else score += 0;

  if (input.planVersion !== null) score += 20;

  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 70 ? 'green' : clamped >= 40 ? 'amber' : 'red';
  const label = clamped >= 70 ? 'ملتزم' : clamped >= 40 ? 'متراجع' : 'غير نشط';
  return { score: clamped, label, color };
}

/* --------------------------- agrégats abonnement ---------------------- */

export interface SummaryMember {
  subscription: {
    dateDebut: Date;
    dateFin: Date;
    pauseStart: Date | null;
    pauseDays?: number | null;
    tier?: string | null;
    montant?: number;
  } | null;
}

export function memberStatus(
  sub: SummaryMember['subscription'],
): SubscriptionStatus {
  return getSubscriptionStatus(sub);
}

export function latestSubscription<T extends Subscription>(
  subs: T[],
): T | null {
  if (subs.length === 0) return null;
  let best = subs[0];
  for (const s of subs) {
    if (s.dateFin.getTime() > best.dateFin.getTime()) best = s;
  }
  return best;
}

export function monthlyKeys(months: number): string[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    keys.push(monthOffsetKey(-i));
  }
  return keys;
}

export function inMonth(date: Date, key: string): boolean {
  return monthKey(date) === key;
}

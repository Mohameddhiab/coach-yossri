import type { MonthlyGoal, WeightLog } from "./domain";

export function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function todayKey(): string {
  return dayKey(new Date());
}

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

export interface WeightTarget {
  poids_kg: number;
  date: string;
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

export function maxStreakOf(goal: MonthlyGoal | null | undefined): number {
  const checkins = goal?.checkins ?? [];
  const days = [...new Set(checkins.map((c) => dayKey(c)))].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = new Date(d + "T00:00:00Z").getTime();
    if (prev !== null && t - prev === 86400000) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}
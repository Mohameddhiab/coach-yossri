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
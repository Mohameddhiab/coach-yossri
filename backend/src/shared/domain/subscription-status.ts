import type { SubscriptionStatus } from './domain-types';

export interface SubscriptionLike {
  dateFin: Date;
  dateDebut: Date;
  pauseStart: Date | null;
  pauseDays?: number | null;
  statut?: string;
  modePaiement?: string;
}

export function effectiveDateFin(sub: SubscriptionLike | null): Date {
  if (!sub) return new Date(0);
  const fin = sub.dateFin.getTime();
  const extra = (sub.pauseDays ?? 0) * 86400000;
  return new Date(fin + extra);
}

export function isPaused(sub: SubscriptionLike | null): boolean {
  return !!sub && !!sub.pauseStart;
}

export function getSubscriptionStatus(
  sub: SubscriptionLike | null,
): SubscriptionStatus {
  if (!sub) return 'EXPIRE';
  const now = Date.now();
  const fin = effectiveDateFin(sub).getTime();
  const debut = sub.dateDebut.getTime();
  if (fin < now) return 'EXPIRE';
  if (debut > now) return 'EXPIRE';
  const daysLeft = Math.ceil((fin - now) / 86400000);
  if (daysLeft <= 7) return 'EXPIRE_BIENTOT';
  return 'ACTIF';
}

export function daysLeft(sub: SubscriptionLike | null): number {
  if (!sub) return 0;
  return Math.max(
    0,
    Math.ceil((effectiveDateFin(sub).getTime() - Date.now()) / 86400000),
  );
}

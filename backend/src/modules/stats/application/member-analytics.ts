import type {
  MonthlyGoal,
  Subscription,
  User,
  WeightLog,
  WeightTarget,
} from '@/shared/domain/entities';
import {
  computeBadges,
  computeEngagement,
  computeFidelity,
  computeXp,
  currentStreak,
  estimateTargetDate,
  isCheckedToday,
  latestSubscription,
  maxStreak,
  projectWeight,
  targetProgress,
  type BadgeResult,
  type EngagementScore,
  type Fidelity,
  type WeightProjection,
  type XpResult,
} from '@/shared/domain/stats';
import {
  daysLeft,
  getSubscriptionStatus,
} from '@/shared/domain/subscription-status';
import {
  toSubscriptionApi,
  toUserApi,
  type SubscriptionApi,
} from '@/shared/mapping/api.mapper';
import type { SubscriptionStatus } from '@/shared/domain/domain-types';

export interface MemberAnalyticsInput {
  user: User;
  subscriptionsOf: Subscription[];
  weightLogs: WeightLog[];
  target: WeightTarget | null;
  goal: MonthlyGoal | null;
  planVersion: number | null;
  checkInCountTotal: number;
  checkInCount7d: number;
  followUps: number;
}

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

export interface MemberAnalytics {
  user_id: string;
  user: ReturnType<typeof toUserApi>;
  subscription: SubscriptionApi | null;
  statut: SubscriptionStatus | 'AUCUN';
  days_left: number;
  membership_months: number;
  weight: MemberWeightAnalytics;
  goal: MemberGoalAnalytics;
  fidelity: Fidelity;
  xp: XpResult;
  badges: BadgeResult[];
  engaged_badges: string[];
  engagement: EngagementScore;
  checkins: { total: number; last_7d: number };
  follow_ups: number;
}

export function buildMemberAnalytics(
  input: MemberAnalyticsInput,
): MemberAnalytics {
  const {
    user,
    subscriptionsOf,
    weightLogs,
    target,
    goal,
    planVersion,
    checkInCountTotal,
    checkInCount7d,
    followUps,
  } = input;

  const sorted = [...subscriptionsOf].sort(
    (a, b) => a.dateDebut.getTime() - b.dateDebut.getTime(),
  );
  const latest = latestSubscription(subscriptionsOf);
  const fidelity = computeFidelity(sorted);
  const statut: SubscriptionStatus | 'AUCUN' = latest
    ? getSubscriptionStatus(latest)
    : 'AUCUN';
  const left = latest ? daysLeft(latest) : 0;

  const weightSorted = [...weightLogs].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const firstKg = weightSorted[0]?.poidsKg ?? null;
  const lastKg = weightSorted[weightSorted.length - 1]?.poidsKg ?? null;
  const delta = firstKg !== null && lastKg !== null ? lastKg - firstKg : null;
  const daysSinceLastWeight =
    weightSorted.length > 0
      ? Math.max(
          0,
          Math.floor(
            (Date.now() -
              weightSorted[weightSorted.length - 1].date.getTime()) /
              86400000,
          ),
        )
      : null;

  const projection = projectWeight(weightSorted);
  const eta = target ? estimateTargetDate(weightSorted, target.poidsKg) : null;
  const checkinDays = goal?.checkins ?? [];
  const xp = computeXp(weightSorted, goal, fidelity);
  const badges = computeBadges({
    userCreatedAt: user.createdAt,
    weightLogs: weightSorted,
    goal,
    fidelity,
  });
  const engagement = computeEngagement({
    subscription: latest
      ? {
          dateFin: latest.dateFin,
          dateDebut: latest.dateDebut,
          pauseStart: latest.pauseStart,
          pauseDays: latest.pauseDays,
          statut: latest.statut,
          modePaiement: latest.modePaiement,
          tier: latest.tier,
        }
      : null,
    daysSinceLastWeight,
    planVersion,
  });

  return {
    user_id: user.id,
    user: toUserApi(user),
    subscription: latest ? toSubscriptionApi(latest) : null,
    statut,
    days_left: left,
    membership_months: fidelity.months,
    weight: {
      first_kg: firstKg,
      last_kg: lastKg,
      delta_kg: Math.round((delta ?? 0) * 10) / 10,
      logs_count: weightSorted.length,
      days_since_last_weight: daysSinceLastWeight,
      target: target
        ? {
            poids_kg: target.poidsKg,
            date: target.date.toISOString().slice(0, 10),
          }
        : null,
      target_progress: targetProgress(weightSorted, target),
      projection,
      eta,
    },
    goal: {
      titre: goal?.titre ?? null,
      cible: goal?.cible ?? 0,
      done: checkinDays.length,
      percent: goal
        ? Math.min(100, Math.round((checkinDays.length / goal.cible) * 100))
        : 0,
      current_streak: currentStreak(checkinDays),
      max_streak: maxStreak(checkinDays),
      checked_today: isCheckedToday(checkinDays),
    },
    fidelity,
    xp,
    badges,
    engaged_badges: badges.filter((b) => b.unlocked).map((b) => b.badge.id),
    engagement,
    checkins: { total: checkInCountTotal, last_7d: checkInCount7d },
    follow_ups: followUps,
  };
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import type {
  Subscription,
  WeightLog,
  WeightTarget,
  MonthlyGoal,
  CheckIn,
} from '@/shared/domain/entities';
import type {
  CountByUser,
  MealPlanVersionRef,
  StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import type {
  SubscriptionStatus,
  SubscriptionTier,
  PaymentMode,
} from '@/shared/domain/domain-types';

@Injectable()
export class PrismaStatsRepository implements StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapSubscription(r: {
    id: string;
    userId: string;
    dateDebut: Date;
    dateFin: Date;
    montant: number;
    modePaiement: string;
    statut: string;
    tier: string | null;
    createdBy: string;
    pauseStart: Date | null;
    pauseDays: number;
    createdAt: Date;
  }): Subscription {
    return {
      id: r.id,
      userId: r.userId,
      dateDebut: r.dateDebut,
      dateFin: r.dateFin,
      montant: r.montant,
      modePaiement: r.modePaiement as PaymentMode,
      statut: r.statut as SubscriptionStatus,
      tier: r.tier as SubscriptionTier,
      createdBy: r.createdBy,
      pauseStart: r.pauseStart,
      pauseDays: r.pauseDays,
      createdAt: r.createdAt,
    };
  }

  async subscriptionsOf(userIds: string[]): Promise<Subscription[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.subscription.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapSubscription(r));
  }

  async weightLogsOf(userIds: string[]): Promise<WeightLog[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.weightLog.findMany({
      where: { userId: { in: userIds } },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      date: r.date,
      poidsKg: r.poidsKg,
      note: r.note,
    }));
  }

  async weightTargetsOf(userIds: string[]): Promise<WeightTarget[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.weightTarget.findMany({
      where: { userId: { in: userIds } },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      poidsKg: r.poidsKg,
      date: r.date,
    }));
  }

  async goalsOf(userIds: string[]): Promise<MonthlyGoal[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.monthlyGoal.findMany({
      where: { userId: { in: userIds } },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      titre: r.titre,
      mois: r.mois,
      cible: r.cible,
      checkins: (r.checkins ?? []) as string[],
      createdAt: r.createdAt,
    }));
  }

  async checkInsOf(userIds: string[], since?: Date): Promise<CheckIn[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.checkIn.findMany({
      where: {
        userId: { in: userIds },
        ...(since ? { checkedAt: { gte: since } } : {}),
      },
      orderBy: { checkedAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      coachId: r.coachId,
      checkedAt: r.checkedAt,
    }));
  }

  async noteCountsOf(userIds: string[]): Promise<CountByUser[]> {
    if (userIds.length === 0) return [];
    const grouped = await this.prisma.coachNote.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });
    return grouped.map((g) => ({ userId: g.userId, count: g._count.id }));
  }

  async mealPlanVersionsOf(userIds: string[]): Promise<MealPlanVersionRef[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.mealPlan.findMany({
      where: {
        userId: { in: userIds },
        statut: 'ACTIF',
        isTemplate: false,
      },
      orderBy: [{ createdAt: 'desc' }],
      select: { userId: true, version: true },
    });
    return rows;
  }
}

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

  async allSubscriptions(): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany();
    return rows.map((r) => this.mapSubscription(r));
  }

  async allWeightLogs(): Promise<WeightLog[]> {
    const rows = await this.prisma.weightLog.findMany();
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      date: r.date,
      poidsKg: r.poidsKg,
      note: r.note,
    }));
  }

  async allWeightTargets(): Promise<WeightTarget[]> {
    const rows = await this.prisma.weightTarget.findMany();
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      poidsKg: r.poidsKg,
      date: r.date,
    }));
  }

  async allGoals(): Promise<MonthlyGoal[]> {
    const rows = await this.prisma.monthlyGoal.findMany();
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

  async allCheckIns(): Promise<CheckIn[]> {
    const rows = await this.prisma.checkIn.findMany();
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      coachId: r.coachId,
      checkedAt: r.checkedAt,
    }));
  }

  async activeMealPlanVersions(): Promise<MealPlanVersionRef[]> {
    const rows = await this.prisma.mealPlan.findMany({
      where: { statut: 'ACTIF', isTemplate: false },
      select: { userId: true, version: true },
    });
    return rows;
  }

  async noteCounts(): Promise<CountByUser[]> {
    const grouped = await this.prisma.coachNote.groupBy({
      by: ['userId'],
      _count: { id: true },
    });
    return grouped.map((g) => ({ userId: g.userId, count: g._count.id }));
  }

  async mealPlanVersionOf(userId: string): Promise<{ version: number } | null> {
    const row = await this.prisma.mealPlan.findFirst({
      where: { userId, statut: 'ACTIF', isTemplate: false },
      orderBy: { createdAt: 'desc' },
      select: { version: true },
    });
    return row ?? null;
  }
}

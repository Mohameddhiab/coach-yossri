import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  GOAL_REPOSITORY,
  type GoalRepository,
} from '@/shared/domain/ports/goal-repository.port';
import type { MonthlyGoal } from '@/shared/domain/entities';

@Injectable()
export class PrismaGoalRepository implements GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    userId: string;
    titre: string;
    mois: string;
    cible: number;
    checkins: unknown;
    createdAt: Date;
  }): MonthlyGoal {
    return {
      id: row.id,
      userId: row.userId,
      titre: row.titre,
      mois: row.mois,
      cible: row.cible,
      checkins: Array.isArray(row.checkins) ? (row.checkins as string[]) : [],
      createdAt: row.createdAt,
    };
  }

  async ofMonth(userId: string, mois: string): Promise<MonthlyGoal | null> {
    const row = await this.prisma.monthlyGoal.findUnique({
      where: { userId_mois: { userId, mois } },
    });
    return row ? this.map(row) : null;
  }

  async replace(
    userId: string,
    mois: string,
    titre: string,
    cible: number,
  ): Promise<MonthlyGoal> {
    const row = await this.prisma.monthlyGoal.upsert({
      where: { userId_mois: { userId, mois } },
      update: { titre, cible, checkins: [] },
      create: { userId, mois, titre, cible, checkins: [] },
    });
    return this.map(row);
  }

  async checkin(userId: string, mois: string, now: Date): Promise<MonthlyGoal> {
    const existing = await this.prisma.monthlyGoal.findUnique({
      where: { userId_mois: { userId, mois } },
    });
    const checkins =
      existing && Array.isArray(existing.checkins)
        ? (existing.checkins as string[])
        : [];
    const row = await this.prisma.monthlyGoal.update({
      where: { userId_mois: { userId, mois } },
      data: { checkins: [...checkins, now.toISOString()] },
    });
    return this.map(row);
  }

  async recentCheckins(
    weekAgo: number,
  ): Promise<{ userId: string; count: number }[]> {
    const goals = await this.prisma.monthlyGoal.findMany();
    const weekIso = new Date(weekAgo).getTime();
    return goals.flatMap((g) => {
      const checkins = Array.isArray(g.checkins)
        ? (g.checkins as string[])
        : [];
      const count = checkins.filter(
        (c) => new Date(c).getTime() >= weekIso,
      ).length;
      return count > 0 ? [{ userId: g.userId, count }] : [];
    });
  }
}

export const PrismaGoalRepositoryProvider = {
  provide: GOAL_REPOSITORY,
  useClass: PrismaGoalRepository,
};

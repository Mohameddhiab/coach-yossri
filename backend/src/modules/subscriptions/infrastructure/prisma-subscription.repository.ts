import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  SUBSCRIPTION_REPOSITORY,
  type CreateSubscriptionInput,
  type SubscriptionRepository,
} from '@/shared/domain/ports/subscription-repository.port';
import type { Subscription } from '@/shared/domain/entities';

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    userId: string;
    dateDebut: Date;
    dateFin: Date;
    montant: number;
    tier: string;
    modePaiement: string;
    statut: string;
    createdBy: string;
    pauseStart: Date | null;
    pauseDays: number;
    createdAt: Date;
  }): Subscription {
    return {
      id: row.id,
      userId: row.userId,
      dateDebut: row.dateDebut,
      dateFin: row.dateFin,
      montant: row.montant,
      tier: row.tier as Subscription['tier'],
      modePaiement: row.modePaiement as Subscription['modePaiement'],
      statut: row.statut as Subscription['statut'],
      createdBy: row.createdBy,
      pauseStart: row.pauseStart,
      pauseDays: row.pauseDays,
      createdAt: row.createdAt,
    };
  }

  async latest(userId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { dateFin: 'desc' },
    });
    return row ? this.map(row) : null;
  }

  async list(userId: string): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const row = await this.prisma.subscription.create({
      data: {
        ...input,
        tier: input.tier as import('@prisma/client').$Enums.SubscriptionTier,
      },
    });
    return this.map(row);
  }

  async pause(subId: string, pauseStart: Date): Promise<Subscription | null> {
    try {
      const row = await this.prisma.subscription.update({
        where: { id: subId },
        data: { pauseStart },
      });
      return this.map(row);
    } catch {
      return null;
    }
  }

  async resume(subId: string, pauseDays: number): Promise<Subscription | null> {
    try {
      const row = await this.prisma.subscription.update({
        where: { id: subId },
        data: { pauseStart: null, pauseDays },
      });
      return this.map(row);
    } catch {
      return null;
    }
  }

  async findById(subId: string, userId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { id: subId, userId },
    });
    return row ? this.map(row) : null;
  }
}

export const PrismaSubscriptionRepositoryProvider = {
  provide: SUBSCRIPTION_REPOSITORY,
  useClass: PrismaSubscriptionRepository,
};

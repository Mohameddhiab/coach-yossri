import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  CHECKIN_REPOSITORY,
  type CheckInRepository,
  type CheckInWithUser,
} from '@/shared/domain/ports/checkin-repository.port';
import type { CheckIn } from '@/shared/domain/entities';

@Injectable()
export class PrismaCheckInRepository implements CheckInRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, coachId: string): Promise<CheckIn> {
    const row = await this.prisma.checkIn.create({ data: { userId, coachId } });
    return this.map(row);
  }

  async listByUser(userId: string, limit = 50): Promise<CheckIn[]> {
    const rows = await this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.map(r));
  }

  async listToday(): Promise<CheckInWithUser[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const rows = await this.prisma.checkIn.findMany({
      where: { checkedAt: { gte: start } },
      orderBy: { checkedAt: 'desc' },
      include: { user: { select: { nom: true, prenom: true } } },
    });
    return rows.map((r) => ({
      ...this.map(r),
      userName: r.user.nom,
      userPrenom: r.user.prenom,
    }));
  }

  private map(row: {
    id: string;
    userId: string;
    coachId: string;
    checkedAt: Date;
  }): CheckIn {
    return {
      id: row.id,
      userId: row.userId,
      coachId: row.coachId,
      checkedAt: row.checkedAt,
    };
  }
}

export const PrismaCheckInRepositoryProvider = {
  provide: CHECKIN_REPOSITORY,
  useClass: PrismaCheckInRepository,
};

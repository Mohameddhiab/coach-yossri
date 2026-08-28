import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  PROGRESS_REPOSITORY,
  type ProgressRepository,
} from '@/shared/domain/ports/progress-repository.port';
import type {
  ProgressPhoto,
  WeightLog,
  WeightTarget,
} from '@/shared/domain/entities';

@Injectable()
export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapWeight(row: {
    id: string;
    userId: string;
    poidsKg: number;
    date: Date;
    note: string | null;
  }): WeightLog {
    return {
      id: row.id,
      userId: row.userId,
      poidsKg: row.poidsKg,
      date: row.date,
      note: row.note,
    };
  }

  private mapPhoto(row: {
    id: string;
    userId: string;
    url: string;
    note: string | null;
    date: Date;
  }): ProgressPhoto {
    return {
      id: row.id,
      userId: row.userId,
      date: row.date,
      url: row.url,
      note: row.note,
    };
  }

  private mapTarget(row: {
    id: string;
    userId: string;
    poidsKg: number;
    date: Date;
  }): WeightTarget {
    return {
      id: row.id,
      userId: row.userId,
      poidsKg: row.poidsKg,
      date: row.date,
    };
  }

  async listWeights(userId: string): Promise<WeightLog[]> {
    const rows = await this.prisma.weightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.mapWeight(r));
  }

  async addWeight(data: {
    userId: string;
    poidsKg: number;
    date: Date;
    note: string | null;
  }): Promise<WeightLog> {
    const row = await this.prisma.weightLog.create({ data });
    return this.mapWeight(row);
  }

  async deleteWeight(logId: string): Promise<WeightLog | null> {
    try {
      const row = await this.prisma.weightLog.delete({ where: { id: logId } });
      return this.mapWeight(row);
    } catch {
      return null;
    }
  }

  async findWeightById(logId: string): Promise<WeightLog | null> {
    const row = await this.prisma.weightLog.findUnique({
      where: { id: logId },
    });
    return row ? this.mapWeight(row) : null;
  }

  async lastWeight(userId: string): Promise<WeightLog | null> {
    const row = await this.prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return row ? this.mapWeight(row) : null;
  }

  async targetOf(userId: string): Promise<WeightTarget | null> {
    const row = await this.prisma.weightTarget.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return row ? this.mapTarget(row) : null;
  }

  async setTarget(
    userId: string,
    poidsKg: number,
    date: Date,
  ): Promise<WeightTarget> {
    const row = await this.prisma.weightTarget.upsert({
      where: { userId },
      update: { poidsKg, date },
      create: { userId, poidsKg, date },
    });
    return this.mapTarget(row);
  }

  async deleteTarget(userId: string): Promise<void> {
    await this.prisma.weightTarget.deleteMany({ where: { userId } });
  }

  async listPhotos(userId: string): Promise<ProgressPhoto[]> {
    const rows = await this.prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
    });
    return rows.map((r) => this.mapPhoto(r));
  }

  async addPhoto(data: {
    userId: string;
    url: string;
    note: string | null;
  }): Promise<ProgressPhoto> {
    const row = await this.prisma.progressPhoto.create({ data });
    return this.mapPhoto(row);
  }

  async findPhotoById(photoId: string): Promise<ProgressPhoto | null> {
    const row = await this.prisma.progressPhoto.findUnique({
      where: { id: photoId },
    });
    return row ? this.mapPhoto(row) : null;
  }

  async deletePhoto(photoId: string): Promise<ProgressPhoto | null> {
    try {
      const row = await this.prisma.progressPhoto.delete({
        where: { id: photoId },
      });
      return this.mapPhoto(row);
    } catch {
      return null;
    }
  }
}

export const PrismaProgressRepositoryProvider = {
  provide: PROGRESS_REPOSITORY,
  useClass: PrismaProgressRepository,
};

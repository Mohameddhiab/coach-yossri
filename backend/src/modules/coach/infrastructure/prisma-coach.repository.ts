import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  COACH_REPOSITORY,
  type CoachRepository,
} from '@/shared/domain/ports/coach-repository.port';
import type { CoachNote, CoachSettings } from '@/shared/domain/entities';

const DEFAULT_SETTINGS: Omit<CoachSettings, 'id' | 'updatedAt'> = {
  motivationMessage: 'استمر يا بطل! 🔥',
  rappelIntervalJours: 2,
  sendMotivation: true,
  messageTemplates: [
    'حصة اليوم لا تنسَ! 💪',
    'ركز على هدفك هذا الشهر 🎯',
    'شرب الماء مهم بعد التمرين 💧',
  ],
  totalSeats: 15,
  remainingSeats: 4,
};

@Injectable()
export class PrismaCoachRepository implements CoachRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSettingsRow(): Promise<CoachSettings> {
    const first = await this.prisma.coachSettings.findFirst({
      orderBy: { updatedAt: 'asc' },
    });
    if (first) {
      return {
        id: first.id,
        motivationMessage: first.motivationMessage,
        rappelIntervalJours: first.rappelIntervalJours,
        sendMotivation: first.sendMotivation,
        messageTemplates: Array.isArray(first.messageTemplates)
          ? (first.messageTemplates as string[])
          : [],
        totalSeats: first.totalSeats,
        remainingSeats: first.remainingSeats,
        updatedAt: first.updatedAt,
      };
    }
    const row = await this.prisma.coachSettings.create({
      data: {
        ...DEFAULT_SETTINGS,
        messageTemplates: DEFAULT_SETTINGS.messageTemplates,
      },
    });
    return {
      id: row.id,
      motivationMessage: row.motivationMessage,
      rappelIntervalJours: row.rappelIntervalJours,
      sendMotivation: row.sendMotivation,
      messageTemplates: row.messageTemplates as string[],
      totalSeats: row.totalSeats,
      remainingSeats: row.remainingSeats,
      updatedAt: row.updatedAt,
    };
  }

  async settings(): Promise<CoachSettings> {
    return this.ensureSettingsRow();
  }

  async saveSettings(
    patch: Partial<
      Pick<
        CoachSettings,
        | 'motivationMessage'
        | 'rappelIntervalJours'
        | 'sendMotivation'
        | 'messageTemplates'
        | 'totalSeats'
        | 'remainingSeats'
      >
    >,
  ): Promise<CoachSettings> {
    await this.ensureSettingsRow();
    const current = await this.prisma.coachSettings.findFirst({
      orderBy: { updatedAt: 'asc' },
    });
    if (!current) {
      throw new Error('coachSettings row missing after ensure');
    }
    const row = await this.prisma.coachSettings.update({
      where: { id: current.id },
      data: {
        ...(patch.motivationMessage !== undefined
          ? { motivationMessage: patch.motivationMessage }
          : {}),
        ...(patch.rappelIntervalJours !== undefined
          ? { rappelIntervalJours: patch.rappelIntervalJours }
          : {}),
        ...(patch.sendMotivation !== undefined
          ? { sendMotivation: patch.sendMotivation }
          : {}),
        ...(patch.messageTemplates !== undefined
          ? { messageTemplates: patch.messageTemplates }
          : {}),
        ...(patch.totalSeats !== undefined
          ? { totalSeats: patch.totalSeats }
          : {}),
        ...(patch.remainingSeats !== undefined
          ? { remainingSeats: patch.remainingSeats }
          : {}),
      },
    });
    return {
      id: row.id,
      motivationMessage: row.motivationMessage,
      rappelIntervalJours: row.rappelIntervalJours,
      sendMotivation: row.sendMotivation,
      messageTemplates: row.messageTemplates as string[],
      totalSeats: row.totalSeats,
      remainingSeats: row.remainingSeats,
      updatedAt: row.updatedAt,
    };
  }

  async notesOf(userId: string): Promise<CoachNote[]> {
    const rows = await this.prisma.coachNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      coachId: r.coachId,
      userId: r.userId,
      contenu: r.contenu,
      createdAt: r.createdAt,
    }));
  }

  async noteCountsByUserIds(
    userIds: string[],
  ): Promise<{ userId: string; count: number }[]> {
    if (userIds.length === 0) return [];
    const grouped = await this.prisma.coachNote.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });
    return grouped.map((g) => ({ userId: g.userId, count: g._count.id }));
  }

  async addNote(
    coachId: string,
    userId: string,
    contenu: string,
  ): Promise<CoachNote> {
    const row = await this.prisma.coachNote.create({
      data: { coachId, userId, contenu },
    });
    return {
      id: row.id,
      coachId: row.coachId,
      userId: row.userId,
      contenu: row.contenu,
      createdAt: row.createdAt,
    };
  }

  async deleteNote(noteId: string): Promise<CoachNote | null> {
    try {
      const row = await this.prisma.coachNote.delete({ where: { id: noteId } });
      return {
        id: row.id,
        coachId: row.coachId,
        userId: row.userId,
        contenu: row.contenu,
        createdAt: row.createdAt,
      };
    } catch {
      return null;
    }
  }
}

export const PrismaCoachRepositoryProvider = {
  provide: COACH_REPOSITORY,
  useClass: PrismaCoachRepository,
};

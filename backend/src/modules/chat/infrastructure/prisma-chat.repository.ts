import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  CHAT_REPOSITORY,
  FOLLOWUP_REPOSITORY,
  type ChatRepository,
  type ConversationWithMeta,
  type FollowUpRepository,
} from '@/shared/domain/ports/workout-plan-repository.port';
import type {
  ChatMessage,
  Conversation,
  FollowUp,
} from '@/shared/domain/entities';

@Injectable()
export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapConversation(row: {
    id: string;
    coachId: string;
    userId: string;
    lastMessageAt: Date | null;
  }): Conversation {
    return {
      id: row.id,
      coachId: row.coachId,
      userId: row.userId,
      lastMessageAt: row.lastMessageAt,
    };
  }

  private mapMessage(row: {
    id: string;
    conversationId: string;
    senderId: string;
    contenu: string;
    attachmentUrl: string | null;
    attachmentType: string | null;
    attachmentName: string | null;
    lu: boolean;
    createdAt: Date;
  }): ChatMessage {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      contenu: row.contenu,
      attachmentUrl: row.attachmentUrl,
      attachmentType: row.attachmentType,
      attachmentName: row.attachmentName,
      lu: row.lu,
      createdAt: row.createdAt,
    };
  }

  async findOrCreate(coachId: string, userId: string): Promise<Conversation> {
    const existing = await this.prisma.conversation.findUnique({
      where: { coachId_userId: { coachId, userId } },
    });
    if (existing) return this.mapConversation(existing);
    const row = await this.prisma.conversation.create({
      data: { coachId, userId },
    });
    return this.mapConversation(row);
  }

  async findForCoach(coachId: string): Promise<ConversationWithMeta[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { coachId },
      include: {
        member: { select: { nom: true, prenom: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    const unreads = await this.prisma.chatMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversation: { coachId },
        lu: false,
        NOT: { senderId: coachId },
      },
      _count: { id: true },
    });
    const unreadById = new Map(
      unreads.map((u) => [u.conversationId, u._count.id]),
    );
    return rows.map((r) => {
      const last = r.messages[0] as
        | { contenu: string; attachmentUrl: string | null; attachmentType: string | null }
        | undefined;
      let preview: string | null = last?.contenu ?? null;
      if ((!preview || !preview.trim()) && last?.attachmentUrl) {
        preview = last.attachmentType?.startsWith('video') ? '🎥 Vidéo' : '📷 Photo';
      }
      return {
        ...this.mapConversation(r),
        userName: r.member.nom,
        userPrenom: r.member.prenom,
        unreadCount: unreadById.get(r.id) ?? 0,
        lastMessage: preview,
      };
    });
  }

  async findByUsers(
    coachId: string,
    userId: string,
  ): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({
      where: { coachId_userId: { coachId, userId } },
    });
    return row ? this.mapConversation(row) : null;
  }

  async findById(id: string): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({ where: { id } });
    return row ? this.mapConversation(row) : null;
  }

  async messagesAfter(
    conversationId: string,
    afterIso: string | null,
  ): Promise<(ChatMessage & { senderRole: 'COACH' | 'USER' })[]> {
    const after = afterIso ? new Date(afterIso) : null;
    const rows = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(after && !Number.isNaN(after.getTime())
          ? { createdAt: { gt: after } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { coachId: true },
    });
    const coachId = conv?.coachId ?? '';
    return rows.map((r) => ({
      ...this.mapMessage(r),
      senderRole: r.senderId === coachId ? 'COACH' : 'USER',
    }));
  }

  async addMessage(
    conversationId: string,
    senderId: string,
    contenu: string,
    attachment?: { url: string; type: string; name: string } | null,
  ): Promise<ChatMessage> {
    const row = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId,
          contenu,
          attachmentUrl: attachment?.url ?? null,
          attachmentType: attachment?.type ?? null,
          attachmentName: attachment?.name ?? null,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: msg.createdAt },
      });
      return msg;
    });
    return this.mapMessage(row);
  }

  async markRead(conversationId: string, viewerId: string): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        lu: false,
        NOT: { senderId: viewerId },
      },
      data: { lu: true },
    });
  }

  async unreadCount(conversationId: string, ownerId: string): Promise<number> {
    return await this.prisma.chatMessage.count({
      where: {
        conversationId,
        lu: false,
        NOT: { senderId: ownerId },
      },
    });
  }

  async unreadTotalForCoach(coachId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: {
        conversation: { coachId },
        lu: false,
        NOT: { senderId: coachId },
      },
    });
  }
}

@Injectable()
export class PrismaFollowUpRepository implements FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    coachId: string,
    periode: string,
    bilan: string,
    ajustements: string | null,
  ): Promise<FollowUp> {
    const row = await this.prisma.followUp.create({
      data: { userId, coachId, periode, bilan, ajustements },
      include: { coach: { select: { nom: true, prenom: true } } },
    });
    return this.map(row);
  }

  async listByUser(
    userId: string,
    limit = 50,
  ): Promise<(FollowUp & { coachName: string })[]> {
    const rows = await this.prisma.followUp.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { coach: { select: { nom: true, prenom: true } } },
    });
    return rows.map((r) => this.map(r));
  }

  private map(row: {
    id: string;
    userId: string;
    coachId: string;
    periode: string;
    bilan: string;
    ajustements: string | null;
    createdAt: Date;
    coach?: { nom: string; prenom: string } | null;
  }): FollowUp & { coachName: string } {
    return {
      id: row.id,
      userId: row.userId,
      coachId: row.coachId,
      periode: row.periode,
      bilan: row.bilan,
      ajustements: row.ajustements,
      createdAt: row.createdAt,
      coachName: row.coach ? `${row.coach.prenom} ${row.coach.nom}` : '',
    };
  }

  async delete(id: string, coachId: string): Promise<boolean> {
    const res = await this.prisma.followUp.deleteMany({
      where: { id, coachId },
    });
    return res.count > 0;
  }
}

export const PrismaChatRepositoryProvider = {
  provide: CHAT_REPOSITORY,
  useClass: PrismaChatRepository,
};

export const PrismaFollowUpRepositoryProvider = {
  provide: FOLLOWUP_REPOSITORY,
  useClass: PrismaFollowUpRepository,
};

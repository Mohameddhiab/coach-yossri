import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  CHAT_REPOSITORY,
  type ChatRepository,
  type ConversationWithMeta,
} from '@/shared/domain/ports/workout-plan-repository.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import type { AuthUser } from '@/shared/common/decorators/current-user.decorator';

@Injectable()
export class ListConversationsUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository) {}

  async execute(coachId: string): Promise<ConversationWithMeta[]> {
    return this.chat.findForCoach(coachId);
  }
}

@Injectable()
export class GetMyConversationUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }
    if (!user.coachId) return null;
    const conv = await this.chat.findByUsers(user.coachId, userId);
    if (!conv) return null;
    return {
      id: conv.id,
      coach_id: conv.coachId,
      unread_count: await this.chat.unreadCount(conv.id, userId),
    };
  }
}

@Injectable()
export class GetMessagesUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository) {}

  async execute(
    auth: AuthUser,
    conversationId: string,
    afterIso: string | null,
  ) {
    const conv = await this.chat.findById(conversationId);
    if (
      !conv ||
      (auth.role === 'USER'
        ? conv.userId !== auth.userId
        : conv.coachId !== auth.userId)
    ) {
      fail(404, 'NOT_FOUND', 'المحادثة غير موجودة');
    }
    return this.chat.messagesAfter(conversationId, afterIso);
  }
}

@Injectable()
export class SendMessageUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository) {}

  async execute(auth: AuthUser, conversationId: string, contenu: string) {
    const text = String(contenu ?? '').trim();
    if (!text) {
      fail(400, 'VALIDATION', 'الرسالة فارغة');
    }
    const conv = await this.chat.findById(conversationId);
    if (
      !conv ||
      (auth.role === 'USER'
        ? conv.userId !== auth.userId
        : conv.coachId !== auth.userId)
    ) {
      fail(404, 'NOT_FOUND', 'المحادثة غير موجودة');
    }
    return this.chat.addMessage(
      conversationId,
      auth.userId,
      text.slice(0, 4000),
    );
  }
}

@Injectable()
export class SendToMemberUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(coachId: string, userId: string, contenu: string) {
    const user = await this.users.findById(userId);
    if (
      !user ||
      user.role !== 'USER' ||
      (user.coachId && user.coachId !== coachId)
    ) {
      fail(404, 'NOT_FOUND', 'العضو غير موجود');
    }
    const conv = await this.chat.findByUsers(coachId, userId);
    const conversation =
      conv ?? (await this.chat.findOrCreate(coachId, userId));
    return this.chat.addMessage(
      conversation.id,
      coachId,
      String(contenu ?? '')
        .trim()
        .slice(0, 4000),
    );
  }
}

@Injectable()
export class SendMessageToCoachUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string, contenu: string) {
    const text = String(contenu ?? '').trim();
    if (!text) {
      fail(400, 'VALIDATION', 'الرسالة فارغة');
    }
    const user = await this.users.findById(userId);
    if (!user?.coachId) {
      fail(404, 'NOT_FOUND', 'لا يوجد مدرب مرتبط بحسابك');
    }
    const conv =
      (await this.chat.findByUsers(user.coachId, userId)) ??
      (await this.chat.findOrCreate(user.coachId, userId));
    return this.chat.addMessage(conv.id, userId, text.slice(0, 4000));
  }
}

@Injectable()
export class MarkConversationReadUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository) {}

  async execute(auth: AuthUser, conversationId: string) {
    const conv = await this.chat.findById(conversationId);
    if (
      !conv ||
      (auth.role === 'USER'
        ? conv.userId !== auth.userId
        : conv.coachId !== auth.userId)
    ) {
      fail(404, 'NOT_FOUND', 'المحادثة غير موجودة');
    }
    await this.chat.markRead(conversationId, auth.userId);
  }
}

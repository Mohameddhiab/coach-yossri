import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/common/guards/roles.guard";
import { SubscriptionGuard } from "@/shared/common/guards/subscription.guard";
import { CoachOwnershipGuard } from "@/shared/common/guards/coach-ownership.guard";
import { TierGuard } from "@/shared/common/guards/tier.guard";
import { Roles } from "@/shared/common/decorators/roles.decorator";
import { RequireTier } from "@/shared/common/decorators/require-tier.decorator";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import {
  GetMessagesUseCase,
  GetMyConversationUseCase,
  ListConversationsUseCase,
  MarkConversationReadUseCase,
  SendMessageToCoachUseCase,
  SendToMemberUseCase,
  SendMessageUseCase,
} from "../application/use-cases/chat.use-cases";

export class SendMessageDto {
  @IsString() contenu!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly listConversations: ListConversationsUseCase,
    private readonly myConversation: GetMyConversationUseCase,
    private readonly getMessages: GetMessagesUseCase,
    private readonly sendMessage: SendMessageUseCase,
    private readonly sendToMember: SendToMemberUseCase,
    private readonly sendToCoach: SendMessageToCoachUseCase,
    private readonly markRead: MarkConversationReadUseCase,
  ) {}

  @Get("conversations")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async list(@CurrentUser() auth: AuthUser) {
    const rows = await this.listConversations.execute(auth.userId);
    return rows.map((c) => ({
      id: c.id,
      user_id: c.userId,
      user_name: `${c.userPrenom} ${c.userName}`,
      unread_count: c.unreadCount,
      last_message: c.lastMessage,
      last_message_at: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
    }));
  }

  @Get("me/conversation")
  @RequireTier("PREMIUM_COACH")
  @UseGuards(SubscriptionGuard, TierGuard)
  async my(@CurrentUser() auth: AuthUser) {
    const conv = await this.myConversation.execute(auth.userId);
    return conv ?? null;
  }

  @Post("me/conversation/messages")
  @RequireTier("PREMIUM_COACH")
  @UseGuards(SubscriptionGuard, TierGuard)
  async postToCoach(@CurrentUser() auth: AuthUser, @Body() dto: SendMessageDto) {
    const msg = await this.sendToCoach.execute(auth.userId, dto.contenu);
    return {
      id: msg.id,
      conversation_id: msg.conversationId,
      sender_id: msg.senderId,
      contenu: msg.contenu,
      created_at: msg.createdAt.toISOString(),
    };
  }

  @Post("users/:userId/messages")
  @Roles("COACH")
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async postToMember(
    @CurrentUser() auth: AuthUser,
    @Param("userId") userId: string,
    @Body() dto: SendMessageDto,
  ) {
    const msg = await this.sendToMember.execute(auth.userId, userId, dto.contenu);
    return {
      id: msg.id,
      conversation_id: msg.conversationId,
      sender_id: msg.senderId,
      contenu: msg.contenu,
      created_at: msg.createdAt.toISOString(),
    };
  }

  @Get("conversations/:id/messages")
  @RequireTier("PREMIUM_COACH")
  @UseGuards(SubscriptionGuard, TierGuard)
  async messages(
    @CurrentUser() auth: AuthUser,
    @Param("id") id: string,
    @Query("after") after?: string,
  ) {
    const rows = await this.getMessages.execute(auth, id, after ?? null);
    return rows.map((m) => ({
      id: m.id,
      conversation_id: m.conversationId,
      sender_id: m.senderId,
      sender_role: m.senderRole,
      contenu: m.contenu,
      lu: m.lu,
      created_at: m.createdAt.toISOString(),
    }));
  }

  @Post("conversations/:id/messages")
  @RequireTier("PREMIUM_COACH")
  @UseGuards(SubscriptionGuard, TierGuard)
  async post(
    @CurrentUser() auth: AuthUser,
    @Param("id") id: string,
    @Body() dto: SendMessageDto,
  ) {
    const msg = await this.sendMessage.execute(auth, id, dto.contenu);
    return {
      id: msg.id,
      conversation_id: msg.conversationId,
      sender_id: msg.senderId,
      contenu: msg.contenu,
      created_at: msg.createdAt.toISOString(),
    };
  }

  @Post("conversations/:id/read")
  async read(@CurrentUser() auth: AuthUser, @Param("id") id: string) {
    await this.markRead.execute(auth, id);
    return { ok: true };
  }
}

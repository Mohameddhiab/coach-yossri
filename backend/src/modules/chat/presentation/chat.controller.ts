import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsOptional, IsString } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/common/guards/roles.guard';
import { SubscriptionGuard } from '@/shared/common/guards/subscription.guard';
import { CoachOwnershipGuard } from '@/shared/common/guards/coach-ownership.guard';
import { TierGuard } from '@/shared/common/guards/tier.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { RequireTier } from '@/shared/common/decorators/require-tier.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import { SupabaseService } from '@/shared/supabase/supabase.service';
import {
  GetMessagesUseCase,
  GetMyConversationUseCase,
  ListConversationsUseCase,
  MarkConversationReadUseCase,
  SendMessageToCoachUseCase,
  SendToMemberUseCase,
  SendMessageUseCase,
} from '../application/use-cases/chat.use-cases';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);
const MAX_FILE_BYTES = 30 * 1024 * 1024;

export class SendMessageDto {
  @IsOptional()
  @IsString()
  contenu?: string;
}

function extFromType(mt: string): string {
  if (mt === 'image/jpeg') return 'jpg';
  if (mt === 'image/png') return 'png';
  if (mt === 'image/webp') return 'webp';
  if (mt === 'video/webm') return 'webm';
  if (mt === 'video/quicktime') return 'mov';
  return mt.split('/')[1] ?? 'bin';
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
    private readonly supabase: SupabaseService,
  ) {}

  private async handleUpload(
    file: { mimetype: string; size: number; originalname: string; buffer: Buffer } | undefined,
    prefix: string,
  ): Promise<{ url: string; type: string; name: string } | null> {
    if (!file) return null;
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (max 30 Mo)');
    }
    const ext = extFromType(file.mimetype);
    const key = `chat/${prefix}/${Date.now()}-${randomUUID()}.${ext}`;
    const url = await this.supabase.uploadChatAttachment(key, file.buffer, file.mimetype);
    if (!url) {
      throw new BadRequestException('Échec upload pièce jointe');
    }
    return { url, type: file.mimetype, name: file.originalname };
  }

  private toMessageApi(m: {
    id: string;
    conversationId: string;
    senderId: string;
    contenu: string;
    attachmentUrl: string | null;
    attachmentType: string | null;
    attachmentName: string | null;
    createdAt: Date;
    senderRole?: string;
    lu?: boolean;
  }) {
    return {
      id: m.id,
      conversation_id: m.conversationId,
      sender_id: m.senderId,
      sender_role: (m as { senderRole?: string }).senderRole,
      contenu: m.contenu,
      attachment_url: m.attachmentUrl,
      attachment_type: m.attachmentType,
      attachment_name: m.attachmentName,
      lu: (m as { lu?: boolean }).lu,
      created_at: m.createdAt.toISOString(),
    };
  }

  @Get('conversations')
  @Roles('COACH')
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

  @Get('me/conversation')
  @RequireTier('PREMIUM_COACH')
  @UseGuards(SubscriptionGuard, TierGuard)
  async my(@CurrentUser() auth: AuthUser) {
    const conv = await this.myConversation.execute(auth.userId);
    return conv ?? null;
  }

  @Post('me/conversation/messages')
  @RequireTier('PREMIUM_COACH')
  @UseGuards(SubscriptionGuard, TierGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Type non autorisé'), false);
      },
    }),
  )
  async postToCoach(
    @CurrentUser() auth: AuthUser,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: { mimetype: string; size: number; originalname: string; buffer: Buffer },
  ) {
    const attachment = await this.handleUpload(file, `me-${auth.userId}`);
    const msg = await this.sendToCoach.execute(auth.userId, dto.contenu ?? '', attachment);
    return this.toMessageApi(msg);
  }

  @Post('users/:userId/messages')
  @Roles('COACH')
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Type non autorisé'), false);
      },
    }),
  )
  async postToMember(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: { mimetype: string; size: number; originalname: string; buffer: Buffer },
  ) {
    const attachment = await this.handleUpload(file, `user-${userId}`);
    const msg = await this.sendToMember.execute(auth.userId, userId, dto.contenu ?? '', attachment);
    return this.toMessageApi(msg);
  }

  @Get('conversations/:id/messages')
  @RequireTier('PREMIUM_COACH')
  @UseGuards(SubscriptionGuard, TierGuard)
  async messages(
    @CurrentUser() auth: AuthUser,
    @Param('id') id: string,
    @Query('after') after?: string,
  ) {
    const rows = await this.getMessages.execute(auth, id, after ?? null);
    return rows.map((m) => ({
      id: m.id,
      conversation_id: m.conversationId,
      sender_id: m.senderId,
      sender_role: m.senderRole,
      contenu: m.contenu,
      attachment_url: (m as unknown as { attachmentUrl: string | null }).attachmentUrl ?? null,
      attachment_type: (m as unknown as { attachmentType: string | null }).attachmentType ?? null,
      attachment_name: (m as unknown as { attachmentName: string | null }).attachmentName ?? null,
      lu: m.lu,
      created_at: m.createdAt.toISOString(),
    }));
  }

  @Post('conversations/:id/messages')
  @RequireTier('PREMIUM_COACH')
  @UseGuards(SubscriptionGuard, TierGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Type non autorisé'), false);
      },
    }),
  )
  async post(
    @CurrentUser() auth: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: { mimetype: string; size: number; originalname: string; buffer: Buffer },
  ) {
    const attachment = await this.handleUpload(file, id);
    const msg = await this.sendMessage.execute(auth, id, dto.contenu ?? '', attachment);
    return this.toMessageApi(msg);
  }

  @Post('conversations/:id/read')
  async read(@CurrentUser() auth: AuthUser, @Param('id') id: string) {
    await this.markRead.execute(auth, id);
    return { ok: true };
  }
}

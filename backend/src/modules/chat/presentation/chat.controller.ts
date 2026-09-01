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
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heif-sequence',
  'image/heic-sequence',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/3gpp',
  'video/x-matroska',
]);
function isAllowedMime(mt: string | undefined): boolean {
  if (!mt) return false;
  if (ALLOWED_TYPES.has(mt.toLowerCase())) return true;
  // fallback permissif: tout image/* ou video/* est accepté (couvre mimetype non listé / octet-stream mal détecté)
  const low = mt.toLowerCase();
  if (low.startsWith('image/') || low.startsWith('video/')) return true;
  return false;
}
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
    // Certains navigateurs (iOS) envoient mimetype vide → inférer depuis l'extension
    let mt = file.mimetype?.toLowerCase();
    if (!mt || mt === 'application/octet-stream') {
      const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
      if (['jpg', 'jpeg'].includes(ext)) mt = 'image/jpeg';
      else if (ext === 'png') mt = 'image/png';
      else if (ext === 'webp') mt = 'image/webp';
      else if (ext === 'heic') mt = 'image/heic';
      else if (ext === 'heif') mt = 'image/heif';
      else if (ext === 'mp4') mt = 'video/mp4';
      else if (ext === 'mov') mt = 'video/quicktime';
      else if (ext === 'webm') mt = 'video/webm';
      else mt = file.mimetype;
    }
    if (!isAllowedMime(mt)) {
      throw new BadRequestException(`Type de fichier non autorisé (${file.mimetype || 'inconnu'})`);
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (max 30 Mo)');
    }
    const ext = extFromType(mt);
    const key = `chat/${prefix}/${Date.now()}-${randomUUID()}.${ext}`;
    // S'assurer que buffer est bien un Buffer (multer memoryStorage)
    const buf = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer as unknown as Uint8Array);
    const url = await this.supabase.uploadChatAttachment(key, buf, mt);
    if (!url) {
      // Log côté serveur pour diagnostic Render
      console.error('[chat] uploadChatAttachment returned null', { key, mt, size: file.size, supabaseEnabled: this.supabase.isEnabled(), bucket: this.supabase.getChatBucket() });
      throw new BadRequestException('Échec upload pièce jointe — stockage indisponible, réessayez');
    }
    return { url, type: mt, name: file.originalname };
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
        if (isAllowedMime(file.mimetype) || !file.mimetype) cb(null, true);
        else cb(new BadRequestException(`Type non autorisé (${file.mimetype})`), false);
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
        if (isAllowedMime(file.mimetype) || !file.mimetype) cb(null, true);
        else cb(new BadRequestException(`Type non autorisé (${file.mimetype})`), false);
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
        if (isAllowedMime(file.mimetype) || !file.mimetype) cb(null, true);
        else cb(new BadRequestException(`Type non autorisé (${file.mimetype})`), false);
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

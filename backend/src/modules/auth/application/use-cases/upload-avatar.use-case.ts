import { Inject, Injectable, Logger } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import { SupabaseService } from '@/shared/supabase/supabase.service';
import sharp from 'sharp';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class UploadAvatarUseCase {
  private readonly logger = new Logger(UploadAvatarUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly supabase: SupabaseService,
  ) {}

  async execute(
    userId: string,
    file: { mimetype: string; size: number; buffer: Buffer },
  ): Promise<{ avatar_url: string }> {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      fail(400, 'VALIDATION', 'نوع الصورة غير مدعوم (JPEG, PNG, WebP, GIF)');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      fail(400, 'VALIDATION', 'حجم الصورة يتجاوز 5 ميغابايت');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }

    // Process image → square 400px webp (except GIF keep original for animation)
    let outBuffer: Buffer;
    let outType: string;
    if (file.mimetype === 'image/gif') {
      outBuffer = file.buffer;
      outType = 'image/gif';
    } else {
      outBuffer = await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();
      outType = 'image/webp';
    }

    const ext = file.mimetype === 'image/gif' ? 'gif' : 'webp';
    const key = `avatars/${userId}.${ext}`;

    const url = await this.supabase.uploadWebp(key, outBuffer, outType);
    if (!url) {
      this.logger.error(`Avatar upload failed for user ${userId}`);
      fail(500, 'UPLOAD_FAILED', 'فشل رفع الصورة');
    }

    // Update user avatarUrl
    await this.users.update(userId, { avatarUrl: url });

    return { avatar_url: url };
  }
}

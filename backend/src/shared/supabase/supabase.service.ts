import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      this.config.get<string>('SUPABASE_ANON_KEY');
    this.bucket =
      this.config.get<string>('SUPABASE_EXERCISE_BUCKET') ?? 'exercise-images';
    if (url && key) {
      this.client = createClient(url, key, { auth: { persistSession: false } });
      this.logger.log(`Supabase Storage enabled (bucket=${this.bucket})`);
    } else {
      this.logger.warn(
        'Supabase not configured — image re-hosting disabled (fallback to wger URL)',
      );
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getBucket(): string {
    return this.bucket;
  }

  getChatBucket(): string {
    return this.config.get<string>('SUPABASE_CHAT_BUCKET') ?? 'chat-attachments';
  }

  async uploadWebp(
    key: string,
    buffer: Buffer,
    contentType = 'image/webp',
  ): Promise<string | null> {
    if (!this.client) return null;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, buffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000',
      });
    if (error) {
      this.logger.error(`Supabase upload failed ${key}: ${error.message}`);
      return null;
    }
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl ?? null;
  }

  /**
   * Upload chat attachment with performance optimizations:
   * - images: sharp -> webp 1280px max, q80 (~70% size reduction)
   * - videos: pass-through (limit 30 MB)
   * Returns public URL or null.
   * Tries chat bucket then falls back to exercise bucket with chat/ prefix.
   */
  async uploadChatAttachment(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.client) return null;
    let outBuffer = buffer;
    let outType = contentType;
    let outKey = key;

    if (contentType.startsWith('image/')) {
      try {
        outBuffer = await sharp(buffer)
          .resize({ width: 1280, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        outType = 'image/webp';
        if (!outKey.endsWith('.webp')) outKey = outKey.replace(/\.[^.]+$/, '.webp');
      } catch (e) {
        this.logger.warn(`sharp chat compress failed: ${(e as Error).message}`);
      }
    }

    const tryUpload = async (bucket: string, k: string) => {
      const { error } = await this.client!.storage.from(bucket).upload(k, outBuffer, {
        contentType: outType,
        upsert: true,
        cacheControl: '31536000',
      });
      if (error) {
        // bucket not found -> throw to try fallback
        if (error.message.includes('Bucket not found') || error.message.includes('not found') || error.message.includes('Bucket')) {
          throw error;
        }
        this.logger.error(`Supabase chat upload failed ${bucket}/${k}: ${error.message}`);
        return null;
      }
      const { data } = this.client!.storage.from(bucket).getPublicUrl(k);
      return data.publicUrl ?? null;
    };

    const chatBucket = this.getChatBucket();
    try {
      const url = await tryUpload(chatBucket, outKey);
      if (url) return url;
    } catch {
      // fallback to exercise bucket
    }
    // fallback: same bucket as exercises with chat/ prefix if chat bucket missing
    const fallbackKey = outKey.startsWith('chat/') ? outKey : `chat/${outKey}`;
    try {
      return await tryUpload(this.bucket, fallbackKey);
    } catch (e) {
      this.logger.error(`Supabase chat fallback also failed: ${(e as Error).message}`);
      return null;
    }
  }
}

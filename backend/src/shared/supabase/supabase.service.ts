import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>("SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY") ??
      this.config.get<string>("SUPABASE_ANON_KEY");
    this.bucket = this.config.get<string>("SUPABASE_EXERCISE_BUCKET") ?? "exercise-images";
    if (url && key) {
      this.client = createClient(url, key, { auth: { persistSession: false } });
      this.logger.log(`Supabase Storage enabled (bucket=${this.bucket})`);
    } else {
      this.logger.warn("Supabase not configured — image re-hosting disabled (fallback to wger URL)");
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getBucket(): string {
    return this.bucket;
  }

  async uploadWebp(key: string, buffer: Buffer, contentType = "image/webp"): Promise<string | null> {
    if (!this.client) return null;
    const { error } = await this.client.storage.from(this.bucket).upload(key, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      this.logger.error(`Supabase upload failed ${key}: ${error.message}`);
      return null;
    }
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl ?? null;
  }
}

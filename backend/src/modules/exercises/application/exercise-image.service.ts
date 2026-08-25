import { Injectable, Logger } from "@nestjs/common";
import { SupabaseService } from "@/shared/supabase/supabase.service";

@Injectable()
export class ExerciseImageService {
  private readonly logger = new Logger(ExerciseImageService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async rehostIfNeeded(wgerUuid: string, sourceUrl: string | null): Promise<{ url: string | null; thumbUrl: string | null }> {
    if (!sourceUrl) return { url: null, thumbUrl: null };
    if (!this.supabase.isEnabled()) {
      // dev local sans Supabase → garder l'URL wger telle quelle
      return { url: sourceUrl, thumbUrl: null };
    }
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(sourceUrl, { signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) {
        this.logger.warn(`wger image fetch failed ${res.status} ${sourceUrl}`);
        return { url: sourceUrl, thumbUrl: null };
      }
      const arrayBuf = await res.arrayBuffer();
      const input = Buffer.from(arrayBuf);
      // conversion webp 800px max
      let out: Buffer;
      try {
        const sharp = (await import("sharp")).default;
        out = await sharp(input)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
      } catch (e) {
        this.logger.warn(`sharp conversion failed, using original buffer: ${e}`);
        out = input;
      }
      const key = `${wgerUuid}.webp`;
      const publicUrl = await this.supabase.uploadWebp(key, out);
      if (!publicUrl) return { url: sourceUrl, thumbUrl: null };
      return { url: publicUrl, thumbUrl: publicUrl };
    } catch (e) {
      this.logger.warn(`rehost failed for ${sourceUrl}: ${e}`);
      return { url: sourceUrl, thumbUrl: null };
    }
  }
}

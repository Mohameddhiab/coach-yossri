import { Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthRateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  /**
   * Limite par clé (email normalisé) : 5 requêtes / 60s
   * Utilisé en plus du ThrottlerGuard IP (@Throttle).
   * Lève 429 si dépassé et loggue.
   */
  check(key: string, limit = 5, windowMs = 60_000): void {
    const normalized = key.trim().toLowerCase();
    const now = Date.now();
    const bucketKey = `email:${normalized}`;
    let bucket = this.buckets.get(bucketKey);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(bucketKey, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      console.warn(
        `[AuthRateLimit] ${bucketKey} exceeded ${limit}/${windowMs}ms — count=${bucket.count} retryAfter=${retryAfter}s`,
      );
      fail(
        429,
        'TOO_MANY_REQUESTS',
        `Trop de tentatives, réessayez dans ${retryAfter}s`,
      );
    } else if (bucket.count === limit) {
      console.log(`[AuthRateLimit] ${bucketKey} at limit ${limit}`);
    }
    // nettoyage paresseux : supprime les buckets expirés au-delà de 2x window
    if (this.buckets.size > 1000) {
      for (const [k, b] of this.buckets) {
        if (now > b.resetAt + windowMs) this.buckets.delete(k);
      }
    }
  }

  /** Pour tests : reset */
  clear() {
    this.buckets.clear();
  }
}

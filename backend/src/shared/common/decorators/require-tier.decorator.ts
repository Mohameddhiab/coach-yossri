import { SetMetadata } from '@nestjs/common';
import type { SubscriptionTier } from '@/shared/domain/domain-types';

export const REQUIRED_TIER_KEY = 'requiredTier';
export const RequireTier = (tier: SubscriptionTier) =>
  SetMetadata(REQUIRED_TIER_KEY, tier);

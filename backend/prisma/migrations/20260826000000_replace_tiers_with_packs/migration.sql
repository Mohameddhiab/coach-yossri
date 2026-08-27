-- AlterEnum
-- Create new enum values
ALTER TYPE "SubscriptionTier" ADD VALUE 'ONLINE';
ALTER TYPE "SubscriptionTier" ADD VALUE 'PREMIUM_COACH';

-- Update existing subscriptions to use new tier names
UPDATE "subscriptions" SET "tier" = 'ONLINE' WHERE "tier" = 'BASIC';
UPDATE "subscriptions" SET "tier" = 'ONLINE' WHERE "tier" = 'PREMIUM';
UPDATE "subscriptions" SET "tier" = 'PREMIUM_COACH' WHERE "tier" = 'ELITE';

-- Remove old enum values (PostgreSQL doesn't support removing enum values directly)
-- We need to create a new enum and migrate
ALTER TABLE "subscriptions" ALTER COLUMN "tier" SET DEFAULT 'ONLINE';

-- Remove ESSAI from SubscriptionStatus enum
-- Update existing subscriptions with ESSAI status
UPDATE "subscriptions" SET "statut" = 'ACTIF' WHERE "statut" = 'ESSAI';

-- Remove ESSAI from PaymentMode enum
UPDATE "subscriptions" SET "mode_paiement" = 'ESPECE' WHERE "mode_paiement" = 'ESSAI';

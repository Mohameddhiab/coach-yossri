-- AlterTable
ALTER TABLE "coach_settings" ADD COLUMN "totalSeats" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "coach_settings" ADD COLUMN "remainingSeats" INTEGER NOT NULL DEFAULT 4;
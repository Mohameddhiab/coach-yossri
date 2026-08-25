-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('HOMME', 'FEMME');

-- AlterTable
ALTER TABLE "meal_plans" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sexe" "Sexe",
ADD COLUMN     "tailleCm" INTEGER;

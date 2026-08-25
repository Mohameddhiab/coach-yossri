-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('WGER', 'MANUAL');

-- AlterTable workout_exercises: free-text series/rest + new columns
ALTER TABLE "workout_exercises" ALTER COLUMN "series" TYPE TEXT USING "series"::TEXT;
ALTER TABLE "workout_exercises" RENAME COLUMN "reposSec" TO "repos";
ALTER TABLE "workout_exercises" ALTER COLUMN "repos" TYPE TEXT USING "repos"::TEXT;
ALTER TABLE "workout_exercises" ADD COLUMN "charge" TEXT;
ALTER TABLE "workout_exercises" ADD COLUMN "tempo" TEXT;
ALTER TABLE "workout_exercises" ADD COLUMN "imageUrl" TEXT;

-- CreateTable exercises (local library, wger imports)
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageThumbUrl" TEXT,
    "source" "ExerciseSource" NOT NULL DEFAULT 'MANUAL',
    "wgerUuid" TEXT,
    "category" TEXT,
    "licenseTitle" TEXT,
    "licenseAuthor" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_wgerUuid_key" ON "exercises"("wgerUuid");

-- CreateIndex
CREATE INDEX "exercises_name_idx" ON "exercises"("name");

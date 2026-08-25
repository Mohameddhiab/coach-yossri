-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COACH', 'USER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIF', 'ESSAI', 'EXPIRE', 'EXPIRE_BIENTOT');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ESPECE', 'ESSAI');

-- CreateEnum
CREATE TYPE "PlanObjective" AS ENUM ('PRISE_DE_MASSE', 'SECHE', 'MAINTIEN');

-- CreateEnum
CREATE TYPE "MealPlanStatus" AS ENUM ('ACTIF', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM', 'TOUS_LES_JOURS');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('PETIT_DEJ', 'DEJEUNER', 'DINER', 'COLLATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL DEFAULT '',
    "dateNaissance" TIMESTAMP(3),
    "coachId" TEXT,
    "referredBy" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_prefs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rappelPoids" BOOLEAN NOT NULL DEFAULT true,
    "motivation" BOOLEAN NOT NULL DEFAULT true,
    "expirationProche" BOOLEAN NOT NULL DEFAULT true,
    "nouveauPlan" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_prefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modePaiement" "PaymentMode" NOT NULL DEFAULT 'ESPECE',
    "statut" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIF',
    "createdBy" TEXT NOT NULL,
    "pauseStart" TIMESTAMP(3),
    "pauseDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "objectif" "PlanObjective" NOT NULL DEFAULT 'MAINTIEN',
    "caloriesCible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinesG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "glucidesG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lipidesG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "MealPlanStatus" NOT NULL DEFAULT 'ACTIF',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_versions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "jourSemaine" "WeekDay" NOT NULL DEFAULT 'TOUS_LES_JOURS',
    "typeRepas" "MealType" NOT NULL DEFAULT 'DEJEUNER',
    "description" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "proteinesG" DOUBLE PRECISION,
    "glucidesG" DOUBLE PRECISION,
    "lipidesG" DOUBLE PRECISION,
    "alternatives" TEXT,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poidsKg" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_notes" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "mois" TEXT NOT NULL,
    "cible" INTEGER NOT NULL,
    "checkins" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_targets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poidsKg" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "motivationMessage" TEXT NOT NULL,
    "rappelIntervalJours" INTEGER NOT NULL DEFAULT 7,
    "sendMotivation" BOOLEAN NOT NULL DEFAULT true,
    "messageTemplates" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "notification_prefs_userId_key" ON "notification_prefs"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_createdAt_idx" ON "subscriptions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "meal_plans_userId_statut_idx" ON "meal_plans"("userId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plan_versions_planId_version_key" ON "meal_plan_versions"("planId", "version");

-- CreateIndex
CREATE INDEX "meals_mealPlanId_idx" ON "meals"("mealPlanId");

-- CreateIndex
CREATE INDEX "weight_logs_userId_date_idx" ON "weight_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "progress_photos_userId_date_idx" ON "progress_photos"("userId", "date");

-- CreateIndex
CREATE INDEX "coach_notes_userId_createdAt_idx" ON "coach_notes"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_goals_userId_mois_key" ON "monthly_goals"("userId", "mois");

-- CreateIndex
CREATE UNIQUE INDEX "weight_targets_userId_key" ON "weight_targets"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_versions" ADD CONSTRAINT "meal_plan_versions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_goals" ADD CONSTRAINT "monthly_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_targets" ADD CONSTRAINT "weight_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

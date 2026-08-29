CREATE INDEX IF NOT EXISTS "subscriptions_dateDebut_idx" ON "subscriptions" ("dateDebut");
CREATE INDEX IF NOT EXISTS "subscriptions_dateFin_idx" ON "subscriptions" ("dateFin");
CREATE INDEX IF NOT EXISTS "monthly_goals_userId_mois_idx" ON "monthly_goals" ("userId", "mois");
CREATE INDEX IF NOT EXISTS "check_ins_checkedAt_idx" ON "check_ins" ("checkedAt");
CREATE INDEX IF NOT EXISTS "weight_logs_userId_date_idx" ON "weight_logs" ("userId", "date");
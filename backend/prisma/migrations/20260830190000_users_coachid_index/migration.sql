-- Index pour accélérer les requêtes "membres d'un coach" (stats, liste, shell)
CREATE INDEX "users_coachId_idx" ON "users"("coachId");
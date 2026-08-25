# 9AWI — Plan Projet
### *"Saha w 9uwa, m3a coach-ek"*

---

## 1. Vue d'ensemble

Plateforme privée (sans inscription publique) pour un coach de musculation :
- Le **coach (admin)** crée les comptes de ses abonnés et leur assigne un **programme alimentaire** personnalisé.
- L'**user** consulte son plan, suit son poids/progression, et perd l'accès à ses données si son abonnement expire.
- Paiement en **espèces**, géré hors-app (le coach marque juste "payé" dans le dashboard).
- Pas de programme d'exercices dans l'app (change selon la salle chaque mois — géré en salle directement).

---

## 2. Rôles & permissions

| Action | Coach | User |
|---|---|---|
| Créer un compte user | ✅ | ❌ (pas d'inscription) |
| Login | ✅ | ✅ |
| Créer/modifier plan alimentaire | ✅ | Lecture seule |
| Voir tous les users | ✅ | ❌ |
| Ajouter poids/mensurations | ✅ (pour tous) | ✅ (pour lui-même) |
| Gérer abonnement/paiement | ✅ | Lecture seule (statut) |
| Voir données après expiration | ✅ toujours | ❌ bloqué |

---

## 3. Fonctionnalités par rôle

### Coach (Next.js — dashboard web)
- Liste des users avec statut abonnement (actif / expire bientôt / expiré)
- Création rapide d'un user (mot de passe généré, envoyé par email)
- Éditeur de plan alimentaire (repas/jour, macros, alternatives d'aliments)
- Duplication de plan (template → nouvel abonné)
- Vue progression par user (courbe poids, mensurations, photos)
- Gestion abonnement (renouveler, marquer paiement reçu, historique)
- Notes privées par user
- Alertes : qui n'a pas donné de nouvelles depuis X jours

### User (mobile — Flutter ou React Native)
- Login (pas d'inscription)
- Plan alimentaire du jour / de la semaine
- Ajout du poids (courbe de progression en temps réel)
- Ajout de photos de progression (privé, visible coach uniquement)
- Statut d'abonnement (jours restants)
- Settings : mot de passe, préférences de notification
- Notifications email de motivation et rappels

---

## 4. Parcours utilisateur

1. Coach crée le compte en salle → email avec identifiants générés
2. User télécharge l'app, se connecte
3. Coach crée le plan alimentaire personnalisé (macros selon objectif)
4. User consulte son plan chaque jour
5. Chaque semaine, user rentre son poids → courbe visible
6. Emails automatiques si oubli, ou messages de motivation
7. Coach ajuste le plan si besoin → notif "nouveau plan disponible"
8. Fin d'abonnement (paiement espèces) → coach renouvelle, sinon accès aux données bloqué automatiquement

---

## 5. Roadmap

### Phase 1 — MVP
- Auth (JWT, login coach/user)
- CRUD users par le coach
- CRUD plan alimentaire (version simple)
- Ajout de poids + courbe de progression
- Abonnement basique (date début/fin, statut)
- Blocage des données si expiré

### Phase 2 — Motivation & confort
- Emails automatiques (rappel poids, motivation, expiration proche)
- Duplication de plan
- Mensurations + photos de progression
- Historique des versions de plan (versioning)

### Phase 3 — Polish & scalabilité
- Stats globales coach (taux de renouvellement, relances)
- Export PDF du plan alimentaire
- Multi-coach (isolation par coach, si revente future du produit)
- Calcul auto calories/macros selon profil

---

## 6. Pages / écrans

**Web (Coach) :**
`/login` · `/dashboard` · `/users/:id` · `/users/:id/plan` · `/users/new` · `/settings`

**Mobile (User) :**
`Login` · `Home (plan du jour)` · `Plan (semaine)` · `Progression` · `Profil/Settings`

---

Voir `architecture.md` pour la structure technique et `design.md` pour la direction UI/UX.

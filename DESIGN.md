# Coach Yosri — Design Document
### Plateforme de coaching nutrition & suivi pour coach de musculation

> *"Saha w 9uwa, m3a coach-ek"* — Santé et force, avec ton coach.

---

## 1. Vue d'ensemble

**Coach Yosri** est une plateforme privée (pas d'inscription publique) où un **coach (admin)** gère ses abonnés en salle de musculation. Le coach crée les comptes de ses clients, leur assigne un **programme alimentaire personnalisé**, et suit leur **progression physique** (poids, mensurations, photos) dans le temps — indépendamment de la salle où ils s'entraînent (qui peut changer chaque mois).

Le paiement se fait **en espèces, hors app** ; l'app sert uniquement à gérer l'accès (actif/expiré) et l'historique.

### Objectifs clés
- Le coach gagne du temps : création rapide de plans alimentaires, duplication de templates, vue d'ensemble de tous ses clients.
- L'user est motivé : il voit sa courbe de progression, reçoit des rappels, suit son plan facilement depuis son téléphone.
- Aucune donnée visible après expiration de l'abonnement (confidentialité + incitation à renouveler).

---

## 2. Rôles & Permissions

| Action | Coach (Admin) | User |
|---|---|---|
| Créer un compte user | ✅ | ❌ (pas d'inscription) |
| Se connecter (login) | ✅ | ✅ |
| Créer/modifier un plan alimentaire | ✅ | ❌ (lecture seule) |
| Voir son propre plan | — | ✅ |
| Voir tous les users | ✅ | ❌ |
| Ajouter poids / mensurations | ✅ (pour n'importe qui) | ✅ (pour lui-même) |
| Voir sa progression (graphes) | ✅ (tous) | ✅ (le sien seul) |
| Gérer abonnement / paiement | ✅ | ❌ (lecture seule : statut) |
| Modifier profil / settings | ✅ (le sien) | ✅ (le sien : mdp, tel, notif) |
| Voir données après expiration | ✅ (toujours, via admin) | ❌ (bloqué, message affiché) |

Il n'y a que **2 rôles** : `COACH` et `USER`. Pas d'inscription publique — seul le coach crée des comptes (email + mot de passe généré, envoyé par email ou donné en main propre).

---

## 3. Stack technique recommandée

Aligné sur ton stack actuel pour aller vite :

| Couche | Techno |
|---|---|
| Backend API | **NestJS** + TypeScript |
| Base de données | **PostgreSQL** (Prisma ou TypeORM) |
| Auth | JWT (access + refresh token), bcrypt pour les mots de passe |
| Espace Coach (web) | **Next.js** (dashboard admin complet) |
| Espace User (mobile) | **Flutter** ou **React Native** (consultation plan + poids, plus pratique en salle que le web) |
| Emails (notifications) | Resend / Nodemailer + SMTP (ex: Brevo/Sendinblue, gratuit jusqu'à un certain volume) |
| Stockage photos (progression) | Cloudinary ou S3-compatible (Backblaze B2, moins cher) |
| Hébergement backend | Railway / Render (free tier au début) |
| Hébergement Next.js | Vercel |

---

## 4. Modèle de données (entités principales)

```
User
├── id (uuid)
├── role: ENUM('COACH', 'USER')
├── email (unique)
├── password_hash
├── nom, prenom
├── telephone
├── date_naissance (optionnel)
├── created_at
└── coach_id (nullable, si role=USER → référence vers le coach)

Subscription
├── id
├── user_id → User
├── date_debut
├── date_fin
├── montant
├── mode_paiement: ENUM('ESPECE')  // extensible plus tard
├── statut: ENUM('ACTIF', 'EXPIRE')  // calculé ou stocké
└── created_by (coach_id)

MealPlan
├── id
├── user_id → User
├── coach_id → User
├── titre (ex: "Plan prise de masse - Phase 1")
├── objectif: ENUM('PRISE_DE_MASSE', 'SECHE', 'MAINTIEN')
├── calories_cible, proteines_g, glucides_g, lipides_g
├── statut: ENUM('ACTIF', 'ARCHIVE')
├── version (incrémenté à chaque modif majeure → historique gardé)
└── created_at, updated_at

Meal (repas individuel dans un plan)
├── id
├── meal_plan_id → MealPlan
├── jour_semaine: ENUM('LUN'...'DIM') ou 'TOUS_LES_JOURS'
├── type_repas: ENUM('PETIT_DEJ', 'DEJEUNER', 'DINER', 'COLLATION')
├── description (texte libre : aliments + quantités)
├── calories, proteines, glucides, lipides (optionnel, calculé ou saisi)
└── alternatives (texte libre, ex: "si pas de poulet → dinde ou thon")

WeightLog
├── id
├── user_id → User
├── date
├── poids_kg
└── note (optionnel)

Measurement (mensurations, optionnel phase 2)
├── id
├── user_id → User
├── date
├── tour_taille, tour_bras, tour_cuisses, tour_hanches
└── ...

ProgressPhoto
├── id
├── user_id → User
├── date
├── url
└── visible_par_coach: boolean (toujours true, mais explicite pour la confidentialité)

CoachNote (notes privées, jamais visibles par le user)
├── id
├── coach_id → User
├── user_id → User
├── contenu
└── created_at

Notification
├── id
├── user_id → User
├── type: ENUM('RAPPEL_POIDS', 'MOTIVATION', 'ABONNEMENT_EXPIRE_BIENTOT', 'NOUVEAU_PLAN')
├── canal: ENUM('EMAIL')
├── statut: ENUM('ENVOYE', 'ECHEC')
└── date_envoi
```

**Point de design important — versioning du plan alimentaire :**
Le plan est **modifiable en cours de route** par le coach (selon l'évolution du poids). Chaque modification incrémente `version` et l'ancienne version reste en base (historique consultable par le coach). Le user voit toujours uniquement la dernière version active.

---

## 5. Logique métier clé

### 5.1 Expiration d'abonnement
- Un job planifié (cron, ex: tous les jours à minuit) vérifie `date_fin` de chaque `Subscription` et met à jour le `statut`.
- Quand `statut = EXPIRE` :
  - Le user peut toujours se connecter, **mais** l'app affiche un écran unique : *"Ton abonnement est terminé — contacte ton coach pour renouveler"* avec les coordonnées du coach/salle.
  - Aucune donnée (plan, poids, historique) n'est retournée par l'API tant que le statut est EXPIRE — le check se fait **côté backend** (pas juste caché côté front, sinon contournable).
  - Le coach, lui, garde accès à toutes les données de cet user à tout moment (pour renouveler en connaissance de cause).

### 5.2 Notifications automatiques (email)
- **Rappel hebdo** : si l'user n'a pas ajouté son poids depuis 7 jours → email de rappel.
- **Motivation** : email périodique (configurable par le coach) avec un message encourageant.
- **Abonnement bientôt expiré** : email automatique 3 jours avant `date_fin`.
- **Nouveau plan assigné** : email quand le coach crée/modifie un plan.

### 5.3 Duplication de plan (gain de temps coach)
Le coach peut dupliquer un `MealPlan` existant (le sien ou celui d'un autre user) comme point de départ pour un nouvel abonné, puis ajuster.

---

## 6. Fonctionnalités par rôle

### Coach (Next.js — dashboard web)
- Liste de tous les users avec statut abonnement (actif / expire bientôt / expiré), triable/filtrable
- Création rapide d'un user (email, tel, génère mot de passe, envoi par email)
- Création/édition de plan alimentaire (repas par jour, macros, alternatives)
- Duplication de plan
- Vue progression de chaque user (courbe de poids, mensurations, photos)
- Gestion abonnement (renouveler, marquer paiement espèces reçu, historique paiements)
- Notes privées par user
- Vue d'ensemble : "qui n'a pas donné de nouvelles depuis 2 semaines"

### User (Flutter/React Native — mobile)
- Login (pas d'inscription)
- Voir son plan alimentaire du jour / de la semaine
- Ajouter son poids (1 clic, historique visuel en courbe)
- Ajouter des photos de progression (privé, visible coach uniquement)
- Voir son statut d'abonnement (jours restants)
- Settings : changer mot de passe, préférences de notification
- Recevoir notifications push/email de motivation et rappels

---

## 7. Parcours utilisateur (user journey)

1. Le coach crée le compte de l'user en salle (email + tel) → mot de passe généré envoyé par email.
2. L'user télécharge l'app, se connecte avec ses identifiants.
3. Le coach crée son plan alimentaire personnalisé (macros selon objectif).
4. L'user consulte son plan chaque jour depuis son téléphone.
5. Chaque semaine, l'user rentre son poids → il voit sa courbe évoluer.
6. Il reçoit un email s'il oublie de rentrer son poids, ou un message motivant.
7. Le coach ajuste le plan si besoin (nouvelle version) → l'user reçoit une notif "nouveau plan disponible".
8. À la fin de l'abonnement (paiement espèces au coach), le coach renouvelle manuellement → sinon l'accès aux données se bloque automatiquement.

---

## 8. Roadmap de développement

### Phase 1 — MVP (le cœur du produit)
- Auth (login coach/user, JWT)
- CRUD users par le coach
- CRUD plan alimentaire (repas simples, sans versioning au début)
- Ajout de poids + courbe de progression simple
- Gestion abonnement basique (date début/fin, statut manuel)
- Blocage des données si expiré

### Phase 2 — Motivation & confort
- Notifications email automatiques (rappel poids, motivation, expiration proche)
- Duplication de plan
- Mensurations + photos de progression
- Historique des versions de plan

### Phase 3 — Polish & scalabilité
- Dashboard coach avec stats globales (relances, taux de renouvellement)
- Export PDF du plan alimentaire (pour l'avoir hors ligne)
- Multi-coach (si tu veux un jour vendre ça à d'autres coachs — chaque coach isolé avec ses propres users)
- Calcul auto de calories/macros selon profil (poids, taille, objectif)

---

## 9. Pages / écrans nécessaires

**Web (Coach) :**
`/login` · `/dashboard` (liste users) · `/users/:id` (fiche user + plan + progression) · `/users/:id/plan` (éditeur plan) · `/users/new` · `/settings`

**Mobile (User) :**
`Login` · `Home` (plan du jour) · `Plan` (semaine complète) · `Progression` (courbe poids + photos) · `Profil/Settings`

---

## 10. Nom & Branding

**Coach Yosri / كوتش يسري** — d'après le nom du coach fondateur, avec la mention « قاوي » (darja tunisienne, quelqu'un de fort, costaud) en clin d'œil à l'héritage. Logo : haltère stylisé + typographie bold.

- Tagline : *"Saha w 9uwa, m3a coach-ek"*
- Alternatives si besoin de varier : **Sahtek** (ta santé), **T9awa** (deviens fort)
- Domaine possible : `coachyosri.tn`, `coachyosri.app`, ou `getcoachyosri.com`

# Coach Yosri / كوتش يسري — Définition du projet pour génération d'idées créatives

> Document à donner tel quel à une autre IA pour obtenir des idées créatives d'amélioration du produit.

---

## 1. Concept du produit

**Coach Yosri / كوتش يسري** (nom d'origine « قاوي » = *sois fort* en arabe, avec le mot « قوّة »/force) est une **plateforme privée de coaching nutrition & suivi physique** pour un coach de musculation en Tunisie.

Rien n'est public : **pas d'inscription en ligne**. Le coach crée les comptes de ses abonnés en salle, leur génère un mot de passe, et gère leur **abonnement payé en espèces** (hors app). L'abonné consulte son **plan alimentaire personnalisé**, enregistre son **poids régulièrement**, et suit sa **progression** (courbe, photos). Si son abonnement expire, il **perd l'accès à ses données** (écran bloqué) jusqu'au renouvellement.

Deux espaces :
- **Espace Coach (web)** : gestion complète des membres, plans, abonnements, alertes.
- **Espace User (web/PWA + mobile prévu)** : son plan du jour, sa progression, son abonnement, ses réglages.

Langue : **arabe (RTL)** — toute l'UI est en arabe tunisien, y compris les messages d'erreur.

## 2. Rôles & permissions

| Action | Coach | User |
|---|---|---|
| Créer un compte | ✅ | ❌ (pas d'inscription) |
| Modifier plan alimentaire | ✅ | Lecture seule |
| Ajouter poids / photos | ✅ (pour tous) | ✅ (pour lui-même) |
| Gérer abonnement (renouveler, essai, historique) | ✅ | Lecture seule |
| Notes privées sur un membre | ✅ | ❌ |
| Voir les données après expiration | ✅ | ❌ (bloqué) |

## 3. Fonctionnalités DÉJÀ implémentées (ne pas re-proposer)

### Coach
- **Dashboard** avec stats (total / actif / expire bientôt / expiré) + **file d'alertes prioritaires** (« يحتاج انتباهك » : abonnements expirés → relancer, expire ≤7j, essai ≤3j, membres sans poids depuis ≥14j — chaque alerte ouvre la fiche membre).
- **Liste des membres** : recherche (nom/email/téléphone), filtres par statut, badge abonnement, dernier poids + ancienneté, version de plan.
- **Création de compte** : prénom, nom, email, téléphone, + option **essai gratuit 7 jours** ou abonnement payant initial (dates + montant), mot de passe généré affiché une fois.
- **Fiche membre** : informations, modification (avec date de naissance), abonnement courant + historique des paiements, **carte de fidélité** (bronze 3 mois / argent 6 / or 12 + progression), **objectif mensuel « Série du mois »** (titre + nb de séances, progression, streak), notes privées, **renewal** (dont essai 7j), reset password, suppression complète.
- **Plan alimentaire** : éditeur par jour (7 jours + « tous les jours »), macros (calories/P/G/L), alternatives d'aliments, duplication depuis un template, **versioning** (historique des versions), **export PDF imprimable** (vue 7 jours).
- **Progression** : courbe de poids (style « plaques de fonte »), **projection de poids à 4 semaines** (régression linéaire), ajout de poids, galerie photos avec **slider avant/après**, mensurations prévues.
- **Réglages coach** : profil, message de motivation, rappel poids (jours), envoi automatique.

### User
- **خطّتي (Mon plan)** : plan du jour avec onglets par jour, macros, **carte « تحدي الشهر »** (check-in « حضرت حصة اليوم » 1/jour, streak 🔥, barre), **export PDF**.
- **تقدّمي (Progression)** : courbe de poids, **projection 4 semaines**, ajout poids (avec file hors-ligne), galerie photos + **slider avant/après**.
- **ملفي (Profil)** : infos perso, date de naissance, coach contact.
- **اشتراكي (Abonnement)** : jours restants, dates, montant, badge essai/actif, **carte de fidélité**, historique, contact coach, écran bloqué si expiré.
- **الإعدادات (Réglages)** : changer mot de passe, préférences de notifications (4 switches), thème clair/sombre.

### Transverse
- Auth JWT (mock actuellement), 2 rôles.
- **PWA hors-ligne** : manifest, service worker (app shell + navigation offline), **bannière « hors-ligne »**, **file de synchronisation des poids** (saisie offline → sync auto au retour du réseau).
- Mode **mock** (localStorage) activé par défaut — l'API réelle NestJS est prévue mais pas encore connectée.

## 4. Stack technique

- **Frontend (actuel)** : Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), react-hook-form + zod, TanStack Query, Recharts, sonner (toasts), next-themes, Cairo font (arabe). Structure feature-based (`src/features/...`).
- **Backend (prévu)** : NestJS clean architecture (domain / application / infrastructure / presentation), Prisma, PostgreSQL, JWT (access 15min + refresh cookie 7j), bcrypt.
- **Emails (prévus)** : queue BullMQ + Redis, Nodemailer/Resend, templates (bienvenue, rappel poids hebdo, motivation, expiration ≤3j, nouveau plan).
- **Mobile (prévu)** : Flutter ou React Native pour l'espace user.
- **Photos** : stockage prévu Cloudinary/S3 ; actuellement data-URL en mock.
- **Cron** : vérification quotidienne des expirations.

## 5. Règles métier importantes

- Paiement **toujours en espèces hors app** — l'app ne fait que l'historique et l'accès.
- **Pas de programme d'exercices** (géré en salle, change chaque mois).
- Statuts : ACTIF / EXPIRE_BIENTOT (≤7j) / EXPIRE / ESSAI (7j gratuits, expire seul).
- Confidentialité : un user ne voit **que ses propres données**.
- Identité : entité `User` unique (coach_id pour les abonnés), abonnements en historique (liste), plan versionné.

## 6. Objectif demandé

Proposer **10 à 15 idées créatives** pour enrichir ce produit (fonctionnalités, engagement, rétention, différenciation, business model, automatisations…). Privilégier les idées :
- **réalisables en frontend seul** avec le mock actuel (priorité), ou nécessitant le backend futur,
- avec un **ratio impact/effort** élevé,
- classées par thème (motivation, coach, business, technique),
- et en précisant pour chacune : la valeur apportée, les données nécessaires, et une estimation d'effort (S/M/L).
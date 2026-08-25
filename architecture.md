# 9AWI — Architecture Technique
### Backend NestJS (Clean Architecture) + Frontend Next.js (Feature-Based)

---

## 1. Vue d'ensemble

```
┌─────────────────┐        ┌──────────────────┐
│  Next.js (Coach) │──HTTP──▶│                  │
└─────────────────┘        │   NestJS API      │──▶ PostgreSQL
┌─────────────────┐        │  (Clean Arch)     │──▶ Redis (queue)
│ Flutter/RN (User)│──HTTP──▶│                  │──▶ SMTP/Resend
└─────────────────┘        └──────────────────┘
```

Deux fronts distincts consomment la même API NestJS : le dashboard Coach (Next.js, web) et l'app User (Flutter ou React Native, mobile).

---

## 2. Backend — NestJS avec Clean Architecture

### 2.1 Principe

Chaque module métier respecte la règle de dépendance de la Clean Architecture : **les dépendances pointent vers l'intérieur**. Le domaine ne connaît rien de NestJS, de Prisma, ni de HTTP.

```
Presentation  →  Application  →  Domain  ←  Infrastructure
  (controllers)    (use-cases)    (entités,      (Prisma repos,
                                    ports)         email adapter)
```

- **Domain** : entités métier pures (classes TS simples), interfaces de repository ("ports"). Aucune dépendance externe.
- **Application** : use-cases (un fichier = une action métier), orchestrent le domaine via les ports.
- **Infrastructure** : implémentations concrètes des ports (Prisma, envoi d'email, stockage photos).
- **Presentation** : contrôleurs NestJS, DTOs de validation (`class-validator`), guards.

### 2.2 Structure des dossiers

```
src/
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── login.use-case.ts
│   │   │       └── refresh-token.use-case.ts
│   │   ├── infrastructure/
│   │   └── presentation/
│   │       ├── auth.controller.ts
│   │       └── auth.module.ts
│   │
│   ├── users/
│   │   ├── domain/
│   │   │   ├── entities/user.entity.ts
│   │   │   └── ports/user.repository.port.ts
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── create-user.use-case.ts
│   │   │       └── list-coach-users.use-case.ts
│   │   ├── infrastructure/
│   │   │   └── repositories/prisma-user.repository.ts
│   │   └── presentation/
│   │       ├── users.controller.ts
│   │       └── users.module.ts
│   │
│   ├── meal-plans/          # entités MealPlan, Meal, versioning
│   ├── subscriptions/       # entités Subscription, Payment
│   ├── progress/            # WeightLog, Measurement, ProgressPhoto
│   └── notifications/       # orchestration des envois (utilise shared/email)
│
├── shared/
│   ├── database/            # PrismaModule global
│   ├── email/                # module email (détail section 4)
│   ├── scheduler/            # jobs cron (détail section 3)
│   └── common/
│       ├── guards/ (JwtAuthGuard, RolesGuard, SubscriptionGuard)
│       ├── decorators/ (@Roles, @CurrentUser)
│       └── filters/ (exception filters globaux)
│
└── main.ts
```

### 2.3 Exemple de flux — création d'un plan alimentaire

1. `MealPlansController.create()` reçoit la requête HTTP, valide le DTO, vérifie via `RolesGuard` que l'appelant est `COACH`.
2. Le contrôleur appelle `CreateMealPlanUseCase.execute(dto)`.
3. Le use-case construit l'entité `MealPlan` (domaine), applique les règles métier (ex: incrémenter la version si un plan actif existe déjà), puis appelle `MealPlanRepositoryPort.save()`.
4. `PrismaMealPlanRepository` (infrastructure) implémente ce port et persiste en base.
5. Le use-case déclenche ensuite un événement `PlanAssignedEvent` → le module `notifications` écoute cet événement et envoie l'email "Nouveau plan disponible" via le module `email`.

Ce découplage permet de tester les use-cases sans base de données réelle (mock du port), et de changer d'ORM sans toucher au métier.

---

## 3. Lifecycle hooks NestJS

Usage concret des hooks de cycle de vie NestJS dans ce projet :

| Hook | Où | Usage |
|---|---|---|
| `OnModuleInit` | `EmailModule` | Vérifie la connexion SMTP au démarrage (`transporter.verify()`) — échoue vite si la config email est cassée, plutôt que de découvrir le problème au premier envoi |
| `OnApplicationBootstrap` | `SchedulerModule` | Démarre les jobs cron **après** que tous les modules soient initialisés (évite de lancer un job qui dépend d'un service pas encore prêt) |
| `OnModuleDestroy` | `DatabaseModule` | Ferme proprement la connexion Prisma (`prisma.$disconnect()`) |
| `OnApplicationShutdown` | `EmailModule` / `QueueModule` | Ferme le pool SMTP et attend que la queue BullMQ termine les jobs en cours avant l'arrêt (évite de perdre un email en cours d'envoi) |

Exemple (`SubscriptionSchedulerService`) :
```ts
@Injectable()
export class SubscriptionSchedulerService implements OnApplicationBootstrap {
  constructor(private readonly checkExpirations: CheckSubscriptionExpirationsUseCase) {}

  onApplicationBootstrap() {
    // Le cron est enregistré ici, une fois que tout le contexte app est prêt
  }

  @Cron('0 0 * * *') // tous les jours à minuit
  async handleDailyCheck() {
    await this.checkExpirations.execute();
    // → met à jour le statut ACTIF/EXPIRE de chaque Subscription
    // → déclenche l'email "abonnement bientôt expiré" si date_fin - 3 jours
  }
}
```

---

## 4. Module Email (serveur email)

Module NestJS **global**, isolé derrière un port pour rester swappable (SMTP direct, Resend, autre provider) sans impacter le reste de l'app.

```
shared/email/
├── domain/
│   └── ports/email-sender.port.ts      # interface IEmailSender
├── infrastructure/
│   ├── nodemailer-email.adapter.ts     # implémentation SMTP
│   └── templates/
│       ├── welcome.template.ts
│       ├── weekly-reminder.template.ts
│       ├── motivation.template.ts
│       ├── subscription-expiring.template.ts
│       └── new-plan.template.ts
├── email.module.ts
└── email.service.ts                    # façade utilisée par les autres modules
```

- **Envoi asynchrone via queue** : `EmailService.send()` ne fait pas l'appel SMTP directement — il pousse un job dans une queue **BullMQ (+ Redis)**. Un `EmailProcessor` consomme la queue et effectue l'envoi réel, avec retry automatique (ex: 3 tentatives, backoff exponentiel) en cas d'échec SMTP temporaire.
- **Pourquoi une queue** : créer un user ou générer un plan ne doit jamais être ralenti/bloqué par la latence d'un serveur SMTP externe.
- **Templates** : contenu HTML généré via un moteur simple (Handlebars ou composants React Email compilés en HTML), respectant la charte graphique de `design.md` (Graphite/Ambre).
- **Déclencheurs** :
  - Événementiel : création de user (bienvenue + identifiants), nouveau plan assigné
  - Planifié (cron) : rappel hebdo si pas de poids ajouté depuis 7 jours, motivation périodique, abonnement expire dans 3 jours

---

## 5. Frontend — Next.js avec architecture Feature-Based

### 5.1 Principe

Les routes (`app/`) restent **minces** : elles composent des éléments venant de `features/`. Toute la logique et l'UI réelle vivent dans des dossiers de feature autonomes, facilement déplaçables/supprimables sans casser le reste.

### 5.2 Structure des dossiers

```
src/
├── app/                                # App Router — routes fines uniquement
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # sidebar + header du dashboard coach
│   │   ├── users/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   ├── users/[id]/plan/page.tsx
│   │   └── settings/page.tsx
│   └── layout.tsx                      # layout racine, design tokens globaux
│
├── features/
│   ├── auth/
│   │   ├── components/LoginForm.tsx
│   │   ├── hooks/useAuth.ts
│   │   ├── api/auth.api.ts             # appels HTTP + react-query
│   │   └── types/auth.types.ts
│   │
│   ├── users/
│   │   ├── components/ (UserTable, UserCard, CreateUserModal)
│   │   ├── hooks/useUsers.ts
│   │   ├── api/users.api.ts
│   │   └── types/
│   │
│   ├── meal-plans/
│   │   ├── components/ (MealPlanEditor, MealCard, DuplicatePlanButton)
│   │   ├── hooks/useMealPlan.ts
│   │   ├── api/
│   │   └── types/
│   │
│   ├── subscriptions/
│   │   └── ... (SubscriptionBadge, RenewModal, PaymentHistory)
│   │
│   └── progress/
│       └── ... (WeightChart avec le motif "plaque de fonte", PhotoGallery)
│
├── shared/
│   ├── components/ui/                  # design system pur (Button, Card, Badge, Modal...)
│   ├── hooks/ (useDebounce, useMediaQuery...)
│   ├── lib/
│   │   ├── api-client.ts               # instance axios/fetch configurée
│   │   └── auth-context.tsx
│   └── styles/
│       └── tokens.css                  # variables CSS issues de design.md
│
└── middleware.ts                       # protection des routes selon rôle + statut abonnement
```

### 5.3 Règle de dépendance frontend

- `app/` peut importer depuis `features/` et `shared/`, jamais l'inverse.
- Une `feature/X` peut importer depuis `shared/`, mais **jamais** depuis une autre `feature/Y` directement (si besoin de partager quelque chose entre deux features, ça doit monter dans `shared/`).
- `shared/components/ui/` ne connaît aucune logique métier — uniquement les tokens de `design.md`.

---

## 6. Authentification & sécurité

- **JWT** : access token courte durée (15 min) + refresh token (cookie httpOnly, 7 jours)
- **Guards NestJS** empilés sur les routes sensibles :
  - `JwtAuthGuard` — vérifie le token
  - `RolesGuard` avec `@Roles('COACH')` — restreint aux endpoints admin
  - `SubscriptionGuard` — appliqué sur tous les endpoints de données user (plan, poids, photos) : si `statut = EXPIRE`, renvoie `403` avec un code d'erreur dédié (`SUBSCRIPTION_EXPIRED`) que le front interprète pour afficher l'écran de blocage
- Mots de passe hashés avec `bcrypt` (jamais stockés en clair, même pour le mot de passe généré à la création du compte)

---

## 7. Déploiement

| Composant | Plateforme |
|---|---|
| API NestJS | Railway ou Render |
| PostgreSQL | Railway/Render (managed) ou Supabase |
| Redis (queue email) | Railway/Render addon |
| Next.js (Coach) | Vercel |
| App User | Flutter/RN — build direct (APK/TestFlight), pas besoin de store au lancement vu l'usage privé |

---

Voir `plan.md` pour les fonctionnalités et `design.md` pour la charte graphique et les composants.

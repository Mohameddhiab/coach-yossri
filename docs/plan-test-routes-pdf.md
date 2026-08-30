# Plan — Test complet routes/API + fix création user + download PDF exercice/plan

**Date:** 2026-08-29
**Auteur:** Muse Spark (plan mode)
**Scope:** `backend/src` (NestJS), `web/src` (Next.js 16), `mobile/src` (Expo) — focus `web` car bug signalé côté frontend

---

## 1) Objectif

- Corriger bug `POST /api/users` : création user affiche erreur générique et ne montre pas `password` généré (`web/src/features/users/components/create-user-form.tsx:88`)
- Ajouter option **télécharger PDF** pour `workoutPlan` et `mealPlan` (actuellement affichage seul `workout-plan-pdf.tsx:8`, `meal-plan-print-view.tsx:79`, `plan/page.tsx:336` preview)
- Mettre en place matrice de test exhaustive **frontend prioritaire** (toutes routes `web/src/app/**` + `web/src/proxy.ts:9` guards) + **backend** `backend/src/modules/*/presentation/*.controller.ts`

---

## 2) État actuel & causes probables

### 2.1 Création user

**Frontend** `create-user-form.tsx:88-109`:
```ts
const res = await createUser.mutateAsync({...}) // → {user, password}
setGenerated(res.password) // affiché ligne 119
```
`catch { toast.error("تعذّر إنشاء الحساب...") }` **masque le vrai message** `ApiError` (`EMAIL_TAKEN` `create-user.use-case.ts:58` "هذا البريد موجود مسبقاً", `VALIDATION` `54`, `forbidNonWhitelisted` `backend/src/main.ts:31`).

Si `POST /users` renvoie `400 EMAIL_TAKEN` ou `400 VALIDATION` (ex: `telephone` `regex 8 chiffres` `create-user-form.tsx:32`, `montant` `min 1` `37`, `date_debut/date_fin` `superRefine 41`), le UI montre toast générique et ne passe jamais à l'état `generated`.

**Backend** `create-user.use-case.ts:51-100`:
- `email` trim + `toLowerCase` + check `findByEmail` → `EMAIL_TAKEN`
- `generatePassword:12` `password.ts:13` alphabet `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789` (sans espace, 12 chars)
- `users.create` + `subs.create` si dates fournies → `isSubscriptionTier` `subscription-tier.ts:19`
- `email.sendWelcome` `91` catch → `console.warn` ne bloque pas, mais si `EMAIL_DRIVER=console` en prod `backend/.env.production:11` → pas d'envoi SMTP, l'utilisateur ne reçoit pas le mail (confusion avec non-affichage password)

**Hypothèse bug vs attendu:**
- L'utilisateur s'attend à voir le `password` **dans l'UI** après création (écran `generated && createdUserId` `113-151` avec `Copy` `126` + lien `/users/${createdUserId}`), pas par email. Si l'API échoue, ce bloc n'est jamais atteint.
- Si l'API réussit mais le `password` n'est pas affiché, c'est que `res.password` est `undefined` (mismatch type `CreateUserInput` `users.api.ts:17` vs backend `CreateUserResult`).

### 2.2 PDF

**Actuel:**
- `web/package.json:21` `jspdf:4.2.1` + `html2canvas:1.4.1` déjà installés
- `web/src/features/workout-plans/components/workout-plan-pdf.tsx:8` et `web/src/features/meal-plans/components/meal-plan-print-view.tsx:79` + `plan-pdf.tsx:239` rendent du HTML imprimable mais pas de `jsPDF.save()`
- `web/src/app/(user)/plan/page.tsx:5` `FileDown` importé mais pas de bouton download, seulement `EmptyState`/`ErrorState` `plan/page.tsx:336`
- `web/src/app/(coach)/users/[id]/page.tsx:560` `WorkoutPlanDayView` + `605` `MealPlanDayView` — même manque

**Attendu:**
- Bouton `تحميل PDF` pour **chaque** plan (meal + workout) côté `User /plan` et `Coach /users/[id]`, fichier nommé `coachyosri-plan-{nom}-{jour}.pdf` ou `coachyosri-{userId}-{date}.pdf`, avec images `guide-assets` `bench-press` etc. et `WEEK_DAY_LABELS`

---

## 3) Plan de test — matrice routes/API

### 3.1 Backend (supertest `backend/test/app.e2e-spec.ts:5`)

| Méthode | Route | Rôle | Payload | Attendu | Fichier |
|---|---|---|---|---|---|
| `POST` | `/auth/login` | anon | `yosricoach@gmail.com/Yosri@Coach2026!` | `201` + `Set-Cookie coachyosri_access; Secure; SameSite=None` `auth.controller.ts:98` + `CORS` `main.ts:10` | `auth.controller.ts:114` |
| `POST` | `/auth/login` | anon | mauvais mdp | `401 INVALID_CREDENTIALS` |  |
| `GET` | `/auth/me` | COACH `credentials:include` | - | `200` `toUserApi` | `auth.controller.ts:157` |
| `GET` | `/auth/me` | anon | - | `401` | `JwtAuthGuard` |
| `POST` | `/auth/forgot-password` | anon | `yosricoach@gmail.com` | `201 ok` (toujours, même si n'existe pas `request-password-reset.use-case.ts:37`) |  |
| `POST` | `/users` | COACH | `email,nom,prenom,tier=ONLINE, montant=60` | `201 {user, password}` `users.controller.ts:72` |  |
| `POST` | `/users` | COACH | email existant | `400 EMAIL_TAKEN` | `create-user.use-case.ts:58` |
| `POST` | `/users` | USER | - | `403` `RolesGuard` | `users.controller.ts:65` |
| `GET` | `/users?search=&status=TOUS` | COACH | - | `200` list |  |
| `PATCH` | `/users/:id` | COACH | `telephone` | `200` |  |
| `POST` | `/users/:id/workout-plan` | COACH | `titre, exercises[]` | `201` | `workout-plans.controller.ts:15` |
| `GET` | `/users/:id/workout-plan` | COACH/USER | - | `200` ou `404` |  |
| `GET` | `/exercises/wger/search?term=` | auth | - | `200` | `exercises.controller.ts:15` |
| `POST` | `/auth/refresh` | cookie `coachyosri_refresh` | - | `201` + nouveau `coachyosri_access; SameSite=None` `auth.controller.ts:131` |  |

### 3.2 Frontend (Playwright `web/tests/e2e/`)

**Auth & guards `web/src/proxy.ts:54` `web/src/app/page.tsx:10`:**
- `/` sans cookie → `LandingPage` `landing-page.tsx:677`; avec `COACH` cookie → redirect `/dashboard`; avec `USER` → `/plan`
- `/login` `login-form.tsx:36` `zod` email/password → `useAuth login` `auth-context.tsx:47` `apiClient POST /auth/login` `auth-context.tsx:54` copie `coachyosri_access` `vercel.app` `Max-Age=900` → `router.push` `dashboard` vs `plan` selon `user.role`
- `/dashboard` sans `COACH` → redirect `/plan` `proxy.ts:85`; sans auth → `/login` `proxy.ts:66`
- `logout` `auth-context.tsx:53` → `POST /auth/logout` + `document.cookie Max-Age=0` + `queryClient.clear()`

**Création user (focus bug):**
- `Coach → /users → bouton Nouveau` → `create-user-form.tsx:154` remplit `prenom,nom,email,telephone` valide, `tier ONLINE` `OFFRES:60` `coach-info.ts:39`, `date_debut/fin` cohérentes, `montant 60` → submit → **assert** `POST /api/users` `201` → UI `generated` visible `113` avec `code` `119` + `Copy` `126` + `Link /users/${id}` `136` + `toast.success`
- Cas d'erreur: `email existant` → `toast.error` doit afficher `EMAIL_TAKEN` message, pas générique; `telephone` trop court → `FormMessage` `33`; `date_fin <= date_debut` → `superRefine 48`

**Plans & PDF:**
- `User → /plan` `plan/page.tsx:43` `todayWeekDay` → `WorkoutPlanDayView` `workout-plan-day-view.tsx:14` avec `AnimatedExerciseImage` `guide-assets/bench-press/frame-1.png` + `MealPlanDayView` `macros` → bouton `FileDown` `plan/page.tsx:5` → click → `download` `coachyosri-plan-...pdf` contient `getGuideImageUrl` `exercise-guide-map.ts:102`
- `Coach → /users/[id]` `560` `605` même vérif + export depuis onglet coach

**Checklist manuelle rapide (30 min) à faire avant chaque deploy:**
1. `COACH` login → dashboard
2. Création user `test+${Date.now()}@example.com` → voir password → copier → logout → login avec ce user → `/plan` vide → OK
3. `Coach` crée `mealPlan` + `workoutPlan` pour ce user → `User` voit `/plan` rempli → download 2 PDFs → ouvrir → images visibles
4. Refresh `F5` sur `/dashboard` → reste `/dashboard` (pas redirect `/login` → `Max-Age` vercel cookie `auth-context.tsx:54`)
5. `Network → /auth/me 200` `access-control-allow-origin: https://coach-yossri.vercel.app` `main.ts:10`

---

## 4) Implémentation PDF download (détaillée)

**Fichiers à créer:**
- `web/src/features/workout-plans/lib/generate-workout-pdf.ts`
- `web/src/features/meal-plans/lib/generate-meal-pdf.ts`
- `web/src/shared/lib/pdf-utils.ts` (helper `html2canvas` → `jsPDF`, `formatDateShort`)

**Utiliser libs existantes (pas de nouvelle dépendance):**
- `html2canvas` capture `ref.current` (`mealPdfRef` `plan/page.tsx:46` à créer pour chaque plan, déjà `workout` ref similaire)
- `jsPDF` `new jsPDF("p","mm","a4")` → `addImage(canvas, "PNG", 0,0,210,297)` → `save()`
- Gérer `guide-assets` `invert` pour PDF fond blanc (forcer `filter: none` avant capture, ou `backgroundColor: "#ffffff"`)

**UI:**
- `web/src/app/(user)/plan/page.tsx:316` `lg:grid` header `التمارين` → ajouter `<Button variant="outline" size="sm" onClick={() => generateWorkoutPdf(workout, day)}><FileDown /> تحميل PDF تمارين</Button>` et idem `الوجبات` `generateMealPdf(plan, day)`
- `web/src/app/(coach)/users/[id]/page.tsx:560` `605` ajouter même boutons (prop `userId`, `day=todayWeekDay()`)
- `toast` `sonner` `workout-plan-pdf.tsx:8` déjà utilisé pour feedback `toast.success("تم التحميل")` / `toast.error`

**Edge:**
- `guide-assets` `web/.gitignore:34` ignoré mais `postinstall` `web/package.json:10` `copy-guide-assets` le régénère sur Vercel → `public/guide-assets` dispo au build, pas besoin de commit
- `USER` sans plan → bouton disabled + `EmptyState` `plan/page.tsx:338`

---

## 5) Fix création user (détaillé)

**Frontend:**
- `web/src/features/users/components/create-user-form.tsx:88` `onSubmit`:
  ```ts
  const res = await createUser.mutateAsync(...) // {user, password}
  // actuel catch générique → améliorer:
  catch (e) {
    const msg = e instanceof ApiError ? e.message : "تعذّر إنشاء الحساب";
    toast.error(msg); // au lieu de générique
    // ne pas setGenerated
  }
  ```
  Vérifier `users.api.ts:17` `createUser` type `CreateUserInput` envoie `date_naissance: null` `telephone` trim, et `useCreateUser` `hooks/useUsers.ts:35` `onSuccess invalidateQueries`
- S'assurer `OFFRES` `coach-info.ts:39` `find` ne jette pas si `tier` undefined (`42` `!` → risqué) → `const o = OFFRES.find(...) ?? OFFRES[0]`

**Backend:**
- `backend/src/modules/users/presentation/users.controller.ts:11` `IsEmail, IsNumber` déjà, mais `CreateUserDto:28` `telephone` est `IsOptional IsString` sans `MinLength` → le `regex 8 chiffres` est frontend seul, backend accepte vide → OK
- Vérifier `ValidationPipe` `main.ts:28` `whitelist/forbidNonWhitelisted` → si frontend envoie `date_naissance: null` alors que DTO attend `date_naissance?: string` `users.controller.ts:35`, ça passe; mais `referred_by` → `referredBy` mapping `80` doit être `null` si `"none"`
- Test `existing` `create-user.use-case.ts:56` `findByEmail` case-insensitive → si `EMAIL_TAKEN` le frontend doit l'afficher, pas le masquer

---

## 6) Risques & dépendances

- **Cookies cross-domain** `auth.controller.ts:95` `sameSite: secure?'none':'lax'` `bb88168` + `vercel.app` copie `auth-context.tsx:54` `api-client.ts:47` → si `Max-Age=900` expire, `proxy.ts:40` `exp*1000 < Date.now()` → redirect `/login` même si `onrender.com` cookie encore valide via `refresh` → à tester `15m` TTL `JWT_ACCESS_TTL`
- **PDF images `guide-assets` CORS `proxy.ts:25` `img-src 'self'`** doit inclure `blob:` et `data:` déjà, OK pour `html2canvas`
- **Prettier `single quotes` `24 fichiers` `git status` restants `backend/.env.production.example` etc. — lot séparé `065977a` déjà, ne pas mélanger avec fix user

---

## 7) Étapes d'exécution proposées (après validation plan)

1. **Reproduire** bug création user avec `Network` + `Render Logs` (`POST /users 400` + payload)
2. **Fix** `create-user-form.tsx:88` affichage `ApiError.message` + `setGenerated` + `OFFRES.find` fallback
3. **Implémenter** `generate-*-pdf.ts` + boutons `plan/page.tsx:316` + `users/[id]/page.tsx:560`
4. **Tests** `backend/test/app.e2e-spec.ts:5` + `web/tests/e2e/create-user.spec.ts` + `plan-pdf.spec.ts`
5. **Vérif** `npm run lint` `npx tsc --noEmit` `npx prisma generate` `ci.yml:41` `npm test` `npm run vercel-build` + `git commit` `push`

---

## 8) Questions ouvertes pour toi

1. Mot de passe affiché: juste `code` copiable `create-user-form.tsx:119` ou aussi envoi par email `sendWelcome` `create-user.use-case.ts:91` (actuellement `console` en prod `065977a`)?
2. PDF: un seul PDF combiné `meal + workout` ou 2 fichiers séparés `coachyosri-exercices.pdf` / `coachyosri-repas.pdf` ?
3. Tests: `mobile` inclus (`expo` `mobile/src/app/login.tsx:2`) ou seulement `web` + `backend` ?
4. Données de test: utiliser `yosricoach@gmail.com` existant ou créer un `seed:test-user` isolé ?
5. Faut-il committer les `24 fichiers` `M` `prettier` restants ensemble ou lot séparé ?

# Coach Yosri — Guide de Déploiement et Fonctionnement 24/24

Ce document décrit **toutes les étapes** pour déployer la plateforme Coach Yosri
(web + mobile + backend) et la faire **fonctionner 24h/24** en production.

> **État actuel de la chaîne (2026-09):** backend en auto-déploiement Render,
> web en **déploiement manuel** Vercel (le `VERCEL_TOKEN` du workflow GitHub est périmé — voir §6).

---

## 1. Architecture de production

```
                    Utilisateurs (navigateur / mobile)
                                   │
                ┌──────────────────┴───────────────────┐
                │                                      │
        ┌───────▼────────┐                     ┌───────▼────────┐
        │   Vercel Web    │  API HTTPS         │  Render Backend │
        │  (Next.js)      │ ─────────────────▶ │  (NestJS)      │
        │  https://…vercel.app│                 │  /api/health   │
        └─────────────────┘                     └───────┬────────┘
                                                        │
                                     ┌──────────────────┼──────────────────┐
                                     ▼                  ▼                  ▼
                              ┌────────────┐     ┌────────────┐     ┌────────────┐
                              │ Supabase   │     │ Upstash    │     │ SMTP e-mail │
                              │ PostgreSQL │     │ Redis      │     │ (templates)│
                              └────────────┘     └────────────┘     └────────────┘

  Garde en vie 24/24 :
  ├── GitHub Actions "Keep Render Alive" (toutes les 14 min) → empêche Render de dormir
  └── (Optionnel) UptimeRobot → alertes si le backend tombe
```

| Service  | Rôle                                        | URL / hébergeur |
|----------|---------------------------------------------|-----------------|
| Vercel   | Frontend web (Next.js)                      | `web/` → projet Vercel `web` |
| Render   | Backend API (NestJS)                        | `https://coach-yossri.onrender.com/api` |
| Supabase | Base de données PostgreSQL                  | `DATABASE_URL` |
| Upstash  | Cache Redis                                 | `REDIS_URL` |
| GitHub Actions | CI, déploiements, keep-alive, sécurité | `.github/workflows/` |

---

## 2. Prérequis / Outils locaux

- Git + un terminal (`pwsh` sur Windows)
- Node.js **22** (même version que la CI)
- CLI Vercel : `npm i -g vercel` (authentifié : `vercel login`)
- CLI GitHub : `gh` (authentifié)
- Docker (optionnel, pour backend en local)

---

## 3. Déploiement du Backend (Render — auto)

Le backend se déploie **automatiquement** sur tout push vers `master` qui touche
`backend/**` (workflow `.github/workflows/deploy-backend.yml`).

### 3.1 Variables d'environnement requises

Dans `backend/.env.production` (et sur Render → Environment) :

| Variable | Exemple |
|----------|---------|
| `DATABASE_URL` | `postgresql://…@aws-0-…pooler.supabase.com:6543/postgres` |
| `REDIS_URL` | `rediss://…` (Upstash) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `CORS_ORIGINS` | URL(s) du front web |
| `WEB_APP_URL` | URL du front web |
| `COOKIE_SECURE` | `true` |

### 3.2 Secrets GitHub pour Render (Settings → Secrets → Actions)

| Secret | Où le trouver |
|--------|---------------|
| `RENDER_DEPLOY_HOOK` | Render → Service → Settings → **Deploy Hooks** (copier l'URL) |
| `RENDER_HEALTH_URL` | `https://coach-yossri.onrender.com/api/health` |

### 3.3 Étapes d'un déploiement backend

1. `git push origin master` avec des changements dans `backend/`.
2. Le workflow `deploy-backend.yml` déclenche le webhook Render (build + start).
3. Le job `verify` attend 60 s puis sonde `RENDER_HEALTH_URL` (5 tentatives / 30 s).
4. Le backend est en ligne : `curl https://coach-yossri.onrender.com/api/health` → `200`.

> ⚠️ **Premier démarrage uniquement :** appliquer les migrations Prisma :
> `npx prisma migrate deploy` (via Render Shell), puis optionnellement seed.

---

## 4. Déploiement du Web (Vercel — actuellement MANUEL)

> ⚠️ La CI vérifie lint + type + build sur chaque push (`ci.yml`, job `Web`).
> Si la CI Web passe, le build est sain et peut être déployé.

### 4.1 Variables d'environnement web

Dans `web/.env.production` (copié au déploiement) :

| Variable | Exemple |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://coach-yossri.onrender.com/api` |
| `SERVER_API_URL` | `https://coach-yossri.onrender.com/api` |

### 4.2 Déploiement manuel (procédure actuelle)

Les projets Vercel sont liés dans `C:\Users\moham\AppData\Local\Temp\opencode\deploy-root\web\.vercel`.

```powershell
# 1) Copier le web frais dans le dossier de déploiement (exclure le lourd)
robocopy "C:\Users\moham\OneDrive\Bureau\sport\web" `
  "C:\Users\moham\AppData\Local\Temp\opencode\deploy-root\web" `
  /E /XD node_modules .next .vercel /NFL /NDL /NJH /NJS
#   (robocopy exit code 1 = succès)

# 2) Déployer en production
#   depuis C:\Users\moham\AppData\Local\Temp\opencode\deploy-root\web
vercel --prod --yes --force

# 3) L'URL de production apparaît en fin de sortie (alias « Production »)
```

Vérifier : la page charge en `200` (HTML en arabe, `dir="rtl"`).

### 4.3 Déploiement automatique (désactivé — token périmé)

Le workflow `.github/workflows/deploy-web.yml` (Vercel CLI via `VERCEL_TOKEN`)
échoue actuellement à l'étape `vercel pull` :

```
Error: The token provided via `--token` argument is not valid.
```

**Pour réactiver l'auto-déploiement web** :
1. Vercel → **Settings** → **Tokens** → **Create** (régénérer un token).
2. Mettre à jour le secret GitHub :
   ```bash
   gh secret set VERCEL_TOKEN   # coller le nouveau token
   ```
3. Tester : `gh workflow run deploy-web.yml` ou prochain push sur `web/**`.

> **Non bloquant** : tant que l'app fonctionne, le déploiement manuel suffit.

---

## 5. Fonctionnement 24/24

Render (tier gratuit) dort après **15 min** d'inactivité. Pour éviter les
"cold start" et garder le backend éveillé :

### 5.1 Keep-Alive GitHub Actions (actif)

`.github/workflows/keep-alive.yml` pings `RENDER_HEALTH_URL` **toutes les 14 min**
(`*/14 * * * *`), soit juste avant le seuil des 15 min. Aucune action requise.

### 5.2 (Recommandé) UptimeRobot

1. [uptimerobot.com](https://uptimerobot.com) (gratuit, 50 monitors).
2. Ajouter un monitor **HTTP(s)** : URL = `https://coach-yossri.onrender.com/api/health`, interval 5 min.
3. Configurer une alerte (email) → notification si le site tombe.

---

## 6. Pipeline CI/CD complète (workflows GitHub)

| Workflow | Fichier | Déclencheur | Rôle |
|----------|---------|-------------|------|
| **CI** | `ci.yml` | push/PR sur `main`/`master` | Lint + type + build (backend & web) |
| **Deploy Backend** | `deploy-backend.yml` | push `backend/**` | Déploie sur Render |
| **Deploy Web** | `deploy-web.yml` | push `web/**` | Déploie sur Vercel ⚠️ token périmé |
| **Keep Alive** | `keep-alive.yml` | toutes les 14 min | Empêche Render de dormir |
| **Security** | `security.yml` | push/PR + lundi 6h UTC | CodeQL, gitleaks, dependency review |

### Surveillance de la CI

```bash
gh run list                 # listes des runs
gh run watch <run-id>       # suivre un run
gh run view <run-id> --log  # logs d'un run
gh run list --workflow=ci.yml --limit 5
```

---

## 7. Vérifications avant de considérer un déploiement comme OK

1. **CI verte** : `master CI` doit avoir **Backend ✓** et **Web ✓**.
2. **Backend en ligne** : `curl https://coach-yossri.onrender.com/api/health` → `200`.
3. **Web en ligne** : la page de prod répond `200` (arabe, `dir="rtl"`).
4. **Keep-alive** : runs du workflow `Keep Render Alive` terminent sans échec.

---

## 8. Guide de résolution rapide

| Problème | Solution |
|----------|----------|
| CI échoue sur lint | `npm run lint` dans `backend/` ou `web/` ; corriger les erreurs `react-hooks/set-state-in-effect`, etc. |
| CI échoue `npm ci` (EUSAGE) | Régénérer le lock : dans le dossier concerné, `npm install --package-lock-only`, puis commit du `package-lock.json`. |
| Déploiement web échoue (`token not valid`) | Voir §4.3 (régénérer `VERCEL_TOKEN` + `gh secret set VERCEL_TOKEN`), ou déployer manuellement (§4.2). |
| Backend ne répond pas | Console Render → Logs ; vérifier `.env`/variables ; re-trigger le webhook. |
| Erreurs CORS | Vérifier `CORS_ORIGINS` backend = URL exacte du web. |
| Problèmes de cookie JWT | Vérifier `COOKIE_SECURE=true`, domaines cohérents, proxy Next.js. |

---

## 9. Coût estimé (au 2026-09)

| Service | Plan | Emploi actuel |
|---------|------|---------------|
| Vercel | Gratuit | >100 Go/mois inclus, builds mensuels |
| Render | Gratuit | dort après 15 min (d'où le keep-alive) |
| Supabase | Gratuit | 500 Mo base, 50 000 MAU |
| Upstash | Gratuit | 10 000 commandes/jour |
| GitHub Actions | Gratuit | 2 000 min/mois |
| UptimeRobot | Gratuit | 50 monitors |

**Total : 0 $/mois** dans les limites du gratuit (avec cold-start possible côté Render).

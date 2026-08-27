# 9AWI CI/CD Pipeline

## Overview

Automated CI/CD pipeline for the 9AWI fitness coaching platform.

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │    CI    │    │ Deploy   │    │ Deploy   │    │ Security │  │
│  │  Lint    │    │ Backend  │    │   Web    │    │   Scan   │  │
│  │  Test    │    │ (Render) │    │ (Vercel) │    │          │  │
│  │  Build   │    │          │    │          │    │          │  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Keep Alive                           │   │
│  │              (Render sleep prevention)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **CI** | `ci.yml` | push, PR | Lint, test, build (backend + web) |
| **Deploy Backend** | `deploy-backend.yml` | push to main (backend/**) | Deploy to Render |
| **Deploy Web** | `deploy-web.yml` | push to main (web/**) | Deploy to Vercel |
| **Security** | `security.yml` | push, PR, weekly | CodeQL, gitleaks, dependency review |
| **Keep Alive** | `keep-alive.yml` | every 14 min | Prevent Render sleep |

## Required Secrets

### Repository Secrets

| Secret | Purpose | Where to get |
|--------|---------|--------------|
| `RENDER_DEPLOY_HOOK` | Trigger Render deploy | Render Dashboard → Service → Settings → Deploy Hooks |
| `RENDER_HEALTH_URL` | Health check URL | Render Dashboard → Service → Info → URL |
| `VERCEL_TOKEN` | Vercel deployment | Vercel Dashboard → Settings → Tokens |

### How to Add Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret with the name and value

## Setup Instructions

### 1. Render (Backend)

1. Go to [render.com](https://render.com)
2. Create **Web Service** from GitHub repo
3. Go to **Settings** → **Deploy Hooks**
4. Copy the hook URL → add as `RENDER_DEPLOY_HOOK` secret
5. Copy the service URL → add as `RENDER_HEALTH_URL` secret (append `/api/health`)

### 2. Vercel (Web)

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo, root directory: `web`
3. Go to **Settings** → **Tokens**
4. Create new token → add as `VERCEL_TOKEN` secret

### 3. GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add all three secrets listed above

## Workflow Details

### CI (`ci.yml`)

Runs on every push and pull request:
- **Backend**: lint → type check → test → build
- **Web**: lint → type check → build

### Deploy Backend (`deploy-backend.yml`)

Runs when backend files change:
1. Triggers Render deploy via webhook
2. Waits 60 seconds for Render to start
3. Checks health endpoint (5 attempts, 30s apart)

### Deploy Web (`deploy-web.yml`)

Runs when web files change:
1. Pulls Vercel environment
2. Builds with `vercel build --prod`
3. Deploys to production

### Security (`security.yml`)

- **Dependency Review**: Blocks PRs with moderate+ vulnerabilities
- **CodeQL**: Analyzes JavaScript code for security issues
- **Gitleaks**: Scans for exposed secrets in git history

### Keep Alive (`keep-alive.yml`)

- Pings backend every 14 minutes
- Prevents Render free tier from sleeping (15 min timeout)
- Shows warning if backend is down

## Branch Protection

Recommended branch protection rules for `main`:

1. Go to **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
     - Add: `Backend (NestJS)`
     - Add: `Web (Next.js)`
   - ✅ Require branches to be up to date
   - ✅ Do not allow bypassing the above settings

## Monitoring

### Check Workflow Runs

```bash
# List recent runs
gh run list

# Watch a specific run
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Check Render Status

```bash
# Health check
curl https://your-backend.onrender.com/api/health
```

### Check Vercel Status

```bash
# List deployments
vercel ls --token=$VERCEL_TOKEN
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CI fails on lint | Run `npm run lint --workspace=backend` locally |
| CI fails on test | Run `npm test --workspace=backend` locally |
| Deploy fails | Check Render/Vercel dashboard for logs |
| Keep alive shows warning | Check if Render service is running |
| Secret not found | Verify secret name matches exactly |

## Cost

- **GitHub Actions**: 2,000 min/month free (≈ 140 runs)
- **Render Free Tier**: 750 hours/month (sleeps after 15 min)
- **Vercel Free Tier**: 100 GB bandwidth/month
- **Total**: $0/month within free tier limits

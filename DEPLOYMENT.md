# 9AWI Production Deployment Guide
## Vercel + Render + Supabase + Upstash (Free 24/7)

---

## Step 1: Supabase (PostgreSQL Database)

1. Go to [supabase.com](https://supabase.com) → Sign up with GitHub
2. Click **New Project**:
   - Organization: Create new or select existing
   - Project name: `9awi-prod`
   - Database password: Generate strong password (save it!)
   - Region: Closest to your users (e.g., `EU West` for Tunisia)
3. Wait for project creation (2-3 minutes)
4. Go to **Settings → Database**:
   - Connection string → **URI**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Copy this to `DATABASE_URL` in `backend/.env.production`
5. Go to **Settings → API**:
   - **Project URL**: `https://xxxxx.supabase.co` → `SUPABASE_URL`
   - **Anon key**: `eyJ...` → `SUPABASE_ANON_KEY`
   - **Service role key**: `eyJ...` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Upstash (Redis)

1. Go to [upstash.com](https://upstash.com) → Sign up with GitHub
2. Click **Create Database**:
   - Name: `9awi-redis`
   - Region: Same as Supabase
   - Type: **Regional** (free tier)
3. Go to **Details**:
   - **Redis URL**: `rediss://...` → `REDIS_URL` in backend `.env.production`
4. Free tier: 10,000 commands/day, 100 MB storage (enough for 9AWI)

---

## Step 3: Render (Backend)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New → Web Service**:
   - Connect GitHub repo: `Mohameddhiab/coach-yossri`
   - Name: `9awi-backend`
   - Runtime: `Docker`
   - Region: Same as Supabase
   - Instance: **Free** (512 MB RAM, sleeps after 15 min)
3. Go to **Environment**:
   - Add all variables from `backend/.env.production`:
     - `DATABASE_URL`
     - `REDIS_URL`
     - `JWT_SECRET` → Generate: `openssl rand -hex 32`
     - `CORS_ORIGINS` → `https://your-app.vercel.app`
     - `WEB_APP_URL` → `https://your-app.vercel.app`
     - `COOKIE_SECURE` → `true`
4. Go to **Settings**:
   - Build command: `docker build -t 9awi-backend .`
   - Dockerfile path: `backend/Dockerfile`
   - Health check path: `/api/health`
5. Click **Deploy** (first deploy takes 3-5 minutes)

---

## Step 4: Vercel (Web Frontend)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Import Project**:
   - Select GitHub repo: `Mohameddhiab/coach-yossri`
   - Root directory: `web`
   - Framework: `Next.js`
3. Go to **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` → `https://your-backend.onrender.com/api`
   - `SERVER_API_URL` → `https://your-backend.onrender.com/api`
4. Click **Deploy** (first deploy takes 2-3 minutes)
5. After deploy:
   - Go to **Settings → Domains**:
   - Add custom domain (optional): `9awi.tn`
   - Note: `https://your-app.vercel.app`

---

## Step 5: UptimeRobot (Keep Render Awake)

1. Go to [uptimerobot.com](https://uptimerobot.com) → Sign up
2. Click **Add New Monitor**:
   - Monitor type: `HTTP(s)`
   - Friendly name: `9awi-backend`
   - URL: `https://your-backend.onrender.com/api/health`
   - Monitoring interval: `5 minutes`
3. Click **Create Monitor**
4. Free tier: 50 monitors, enough for 9AWI

---

## Step 6: Initialize Database

After Render backend is deployed:

```bash
# Run Prisma migration
curl -X POST https://your-backend.onrender.com/api/health

# Seed curated exercises (43 exercises)
curl -X POST https://your-backend.onrender.com/api/exercises/seed-curated
```

Or use Render Shell:
1. Go to Render Dashboard → 9awi-backend → **Shell**
2. Run:
```bash
npx prisma migrate deploy
npx ts-node prisma/seed-curated.ts
```

---

## Step 7: Update GitHub Actions (Keep-Alive)

1. Go to GitHub repo → **Settings → Secrets → Actions**:
   - Add: `RENDER_HEALTH_URL` = `https://your-backend.onrender.com/api/health`
2. The workflow `.github/workflows/keep-alive.yml` will ping every 14 minutes

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Users                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Vercel (Next.js Web)                  │
│           https://your-app.vercel.app           │
└─────────────────┬───────────────────────────────┘
                  │ API calls
                  ▼
┌─────────────────────────────────────────────────┐
│           Render (NestJS Backend)                │
│           https://your-backend.onrender.com     │
└───────┬─────────────────────────┬───────────────┘
        │                         │
        ▼                         ▼
┌───────────────┐       ┌─────────────────┐
│   Supabase    │       │     Upstash     │
│  PostgreSQL   │       │     Redis       │
└───────────────┘       └─────────────────┘
```

---

## Costs (Monthly)

| Service     | Free Tier           | Limits                    |
|-------------|---------------------|---------------------------|
| Vercel      | 100 GB bandwidth    | 100 builds/month          |
| Render      | 750 hours           | Sleeps after 15 min       |
| Supabase    | 500 MB database     | 50,000 MAU                |
| Upstash     | 10,000 commands/day | 100 MB storage            |
| UptimeRobot | 50 monitors         | 5-minute intervals        |

**Total: $0/month** (within free tier limits)

---

## Troubleshooting

### Backend not responding
1. Check Render logs: Dashboard → 9awi-backend → Logs
2. Verify environment variables are set correctly
3. Check if Supabase database is accessible

### CORS errors
1. Verify `CORS_ORIGINS` in backend matches Vercel URL
2. Check `NEXT_PUBLIC_API_URL` in Vercel matches Render URL

### Cookie issues
1. Ensure `COOKIE_SECURE=true` in production
2. Check browser DevTools → Application → Cookies

### Database connection
1. Verify Supabase connection string format
2. Check if IP is whitelisted in Supabase dashboard

---

## Next Steps (Optional)

1. **Custom Domain**: Buy `9awi.tn` → Configure DNS to point to Vercel
2. **Supabase Storage**: Create `exercise-images` bucket for user-uploaded images
3. **SMTP**: Configure real email for password resets
4. **Monitoring**: Add Sentry for error tracking
5. **Analytics**: Add Google Analytics or Plausible

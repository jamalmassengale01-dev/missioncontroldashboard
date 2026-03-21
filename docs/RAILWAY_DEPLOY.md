# Railway Deployment Guide for Mission Control

## Quick Deploy

### 1. Push to GitHub
```bash
cd /root/.openclaw/workspace/mission-control
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mission-control.git
git push -u origin main
```

### 2. Deploy to Railway

**Option A: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

**Option B: Railway Dashboard (Easier)**
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your mission-control repo
5. Railway auto-detects the config from `railway.json`
6. Click "Deploy"

### 3. Environment Variables

In Railway dashboard, add these variables:

```
NODE_ENV=production
AUTH_ENABLED=true
AUTH_SECRET_KEY=your-random-secret-key-here
CHIEF_ARCHITECT_PASSWORD=your-secure-password

# Optional integrations:
ENABLE_TELEGRAM=false
TELEGRAM_BOT_TOKEN=

ENABLE_DISCORD=false
DISCORD_WEBHOOK_URL=

ENABLE_SUPABASE=false
SUPABASE_URL=
SUPABASE_ANON_KEY=

ENABLE_LLM=false
OPENAI_API_KEY=
```

### 4. Custom Domain (Optional)

1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Click "Generate Domain" for free railway.app subdomain
4. Or add your custom domain

### 5. Persistent URL

Once deployed, Railway gives you a permanent URL like:
`https://mission-control-production.up.railway.app`

This URL stays the same across deployments.

---

## Free vs Paid

| Feature | Free | Paid ($5/mo) |
|---------|------|--------------|
| Hours | 500/month | Unlimited |
| Always-on | No (sleeps after inactivity) | Yes |
| Custom domains | Yes | Yes |
| Databases | Yes | Yes |
| Team members | 1 | Unlimited |

**Recommendation:** Start with free, upgrade if you need 24/7 access.

---

## Updating

When you make changes:
```bash
git add .
git commit -m "Update description"
git push
```

Railway auto-deploys on every push to main branch.

---

## Troubleshooting

**Build fails:**
- Check `railway.json` is in repo root
- Check `package.json` has `build` and `start` scripts

**App won't start:**
- Check environment variables are set
- Check logs in Railway dashboard

**Health check fails:**
- Ensure `/api/health` endpoint works
- Check PORT is set correctly (Railway sets this automatically)

---

## Alternative: Render.com

Similar process:
1. Push to GitHub
2. Connect Render.com
3. Use `render.yaml` (create if needed)
4. Deploy

Render has a generous free tier with no sleep.

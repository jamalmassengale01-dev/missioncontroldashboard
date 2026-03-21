# Render Deployment Guide

## Step 1: Create Render Account
1. Go to https://render.com
2. Sign up (can use GitHub or email)

## Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Select "Deploy from directory"
3. Upload your mission-control folder (or connect GitHub)

## Step 3: Configure
- **Name:** mission-control
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Free

## Step 4: Add Environment Variables
Click "Environment" and add:
```
NODE_ENV=production
PORT=10000
AUTH_ENABLED=true
AUTH_SECRET_KEY=your-secret-key
CHIEF_ARCHITECT_PASSWORD=your-password
```

## Step 5: Deploy
Click "Create Web Service"

Render will give you a permanent URL like:
`https://mission-control.onrender.com`

---

## Alternative: Stay on VPS (Simplest)

Your VPS is already running Mission Control with systemd.

**Just buy a domain and point it to your VPS:**

1. Buy domain (Namecheap ~$10/year)
2. Set A record to your VPS IP
3. Install Caddy for HTTPS:

```bash
apt install caddy

cat > /etc/caddy/Caddyfile << 'EOF'
yourdomain.com {
    reverse_proxy localhost:3000
}
EOF

systemctl restart caddy
```

Done! Your domain will have auto HTTPS.

---

**Recommendation:** VPS + Domain is most reliable and costs ~$10/year vs Railway/Render free tier limitations.

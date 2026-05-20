# 🖥️ Local Development Guide

## 📋 Overview

This guide shows how to run DineDesk locally for development, then push changes to update both API and live CMS.

---

## 🚀 Local Setup

### 1. Start Local API

```bash
# Terminal 1 - API
cd packages/api
npm install
npm start
```

API runs on: `http://localhost:3001`

---

### 2. Start Local CMS

```bash
# Terminal 2 - CMS
cd packages/cms
npm install
npm run dev
```

CMS runs on: `http://localhost:5173`

---

### 3. Access Local CMS

Open browser: `http://localhost:5173`

The CMS will connect to your local API at `http://localhost:3001/api`

---

## 🔄 Development Workflow

### Make Changes Locally

1. **Edit code** in either:
   - `packages/api/` (backend)
   - `packages/cms/` (CMS frontend)
   - `packages/site-template/` (restaurant site templates)

2. **Test changes locally**
   - API changes: Test via CMS or API endpoints
   - CMS changes: Refresh browser (Vite hot-reloads)
   - Site template changes: Test via restaurant site preview

3. **Commit changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main
   ```

---

## 🚀 Deploy Changes to Production

### API Changes

When you push API changes:
1. Railway auto-detects push
2. Auto-rebuilds and restarts
3. New API is live in 2-3 minutes

**Manual trigger:** Go to Railway → API service → Redeploy

---

### CMS Changes

When you push CMS changes:
1. Netlify auto-detects push
2. Auto-rebuilds and deploys
3. New CMS is live in 1-2 minutes

**Manual trigger:** Go to Netlify → CMS site → Deploys → Trigger deploy

---

### Both API + CMS Changes

When you push changes to both:
1. Push to GitHub
2. Railway and Netlify both auto-deploy
3. Wait 2-3 minutes for both to complete
4. Test live CMS at `https://app.dinedesk.com.au`

---

## 🔧 Environment Variables

### Local Development

**API (`packages/api/.env`):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=test-secret-local-only
NETLIFY_TOKEN=test-token
# ... other vars
```

**CMS (`packages/cms/.env.local`):**
```env
VITE_CMS_API_URL=http://localhost:3001/api
```

### Production

**API (Railway Dashboard → Variables):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=[your-rotated-secret]
NETLIFY_TOKEN=[your-rotated-token]
CORS_ORIGINS=https://app.dinedesk.com.au,https://localhost:5173
# ... other vars
```

**CMS (Netlify → Environment Variables):**
```env
VITE_CMS_API_URL=https://your-railway-api.up.railway.app/api
```

---

## 🧪 Testing

### Local Testing

```bash
# Test API health
curl http://localhost:3001/

# Test API login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

### Production Testing

```bash
# Test API health
curl https://your-railway-api.up.railway.app/

# Test API login
curl -X POST https://your-railway-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

---

## 🐛 Troubleshooting

### CMS Can't Connect to Local API

**Check:**
1. API is running on port 3001
2. `packages/cms/.env.local` has `VITE_CMS_API_URL=http://localhost:3001/api`
3. CORS allows localhost

---

### CORS Errors in Production

**Fix:** Update Railway → Variables → CORS_ORIGINS
```
CORS_ORIGINS=https://app.dinedesk.com.au,https://localhost:5173
```

---

### Changes Not Deploying

**Check:**
1. Did you push to GitHub?
2. Railway/Netlify show "Deploying" status?
3. Check build logs for errors

---

## 📝 Quick Commands

```bash
# Start API
cd packages/api && npm start

# Start CMS
cd packages/cms && npm run dev

# Start both (in separate terminals)
# Terminal 1:
cd packages/api && npm start
# Terminal 2:
cd packages/cms && npm run dev

# Push changes
git add .
git commit -m "Your message"
git push origin main

# View logs
# Railway: https://railway.com/project/your-project-id
# Netlify: https://app.netlify.com → Your site → Deploys
```

---

## ✅ Checklist Before Pushing

- [ ] Tested locally
- [ ] No console errors
- [ ] API changes work
- [ ] CMS changes work
- [ ] Environment variables correct
- [ ] CORS includes production domain
- [ ] Commit message is clear

---

**Last Updated:** 2026-05-18

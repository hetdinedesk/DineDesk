# 🚨 URGENT: Security Remediation Checklist

## ⚠️ CRITICAL: Secrets Exposed in Repository

The following secrets were found in your repository and **MUST be rotated immediately**:

### Exposed Secrets Found:
1. **JWT_SECRET** - Used for authentication tokens
2. **NETLIFY_TOKEN** - Netlify deployment access
3. **Cloudflare R2 credentials** - File storage access
4. **Google Places API key** - Location services
5. **Database URL** (partial) - Database connection info

---

## 🔐 Step-by-Step Secret Rotation

### 1. JWT_SECRET (Authentication)
**Impact:** Attackers could forge authentication tokens

**Rotation Steps:**
```bash
# Generate new secure JWT secret (run in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

1. Generate new 64-character random string
2. Update in Railway Dashboard → Environment Variables
3. Restart API service
4. All users will need to re-login (expected)

---

### 2. NETLIFY_TOKEN (Deployment)
**Impact:** Attackers could create/modify/delete sites

**Rotation Steps:**
1. Go to Netlify Dashboard → User Settings → Applications
2. Revoke existing token: `nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700`
3. Generate new Personal Access Token
4. Update in Railway Dashboard
5. Restart API service

---

### 3. Cloudflare R2 Credentials
**Impact:** Attackers could access/modify all uploaded images

**Rotation Steps:**
1. Go to Cloudflare Dashboard → R2
2. Delete existing API tokens:
   - Access Key: `18ac2f9d02924197f9308baa8e76c37d`
3. Create new API token with R2 access only
4. Update in Railway Dashboard:
   - `CLOUDFLARE_R2_ACCESS_KEY`
   - `CLOUDFLARE_R2_SECRET_KEY`
5. Restart API service

---

### 4. Google Places API Key
**Impact:** Attackers could use your API quota/costs

**Rotation Steps:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Delete key: `AIza-REDACTED` (see internal password manager for full value)
3. Create new API key
4. Restrict key to:
   - Places API only
   - Your production domain only
5. Update in Railway Dashboard
6. Restart API service

---

## 🛠️ Code Fixes Applied

The following security fixes have been applied:

### ✅ Completed Fixes:

1. **tableId validation bug** (`orders.js`)
   - Fixed: Added `tableId` to request body destructuring

2. **Rate limiting** (`bookings.js`, `clients.js`)
   - Added: 5 bookings per 15 minutes per IP
   - Added: 30 availability checks per minute per IP

3. **CORS security** (`index.js`)
   - Strengthened: Production CORS validation
   - Added: Warning logs for blocked origins

4. **DOMPurify sanitization** (`[...slug].js`)
   - Fixed: Now actually uses DOMPurify for HTML sanitization
   - Added: SSR-safe fallback sanitization

5. **Theme CSS injection prevention** (`theme.js`)
   - Added: Color hex validation
   - Added: Font family sanitization
   - Prevents: CSS injection attacks

6. **File upload validation** (`clients.js`)
   - Added: 10MB file size limit
   - Added: Image MIME type whitelist (jpeg, png, gif, webp, svg)

7. **Email security** (`email.js`)
   - Fixed: Fallback email no longer fakes success
   - Removed: Debug console.log statements

---

## 🚀 Deployment Configuration

### Railway Environment Variables Required:

```env
# Database
DATABASE_URL=postgresql://...

# Auth (ROTATE IMMEDIATELY)
JWT_SECRET=[NEW_64_CHAR_SECRET]

# Netlify (ROTATE IMMEDIATELY)
NETLIFY_TOKEN=[NEW_NETLIFY_TOKEN]
SITE_TEMPLATE_REPO=hetdinedesk/DineDesk
SITE_TEMPLATE_REPO_BRANCH=main

# API URLs (update to production)
NEXT_PUBLIC_CMS_API_URL=https://your-railway-domain.up.railway.app/api
CMS_API_URL=https://your-railway-domain.up.railway.app/api

# Cloudflare R2 (ROTATE IMMEDIATELY)
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=

# Google APIs (ROTATE IMMEDIATELY)
GOOGLE_PLACES_API_KEY=
GEOCODING_API_KEY=

# Stripe (Set before production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS (update to your domains)
CORS_ORIGINS=https://your-cms.com,https://your-site.netlify.app

# Server
NODE_ENV=production
PORT=3001
```

---

## 🧹 Remove Secrets from Git History

**⚠️ IMPORTANT:** The .env files are now in .gitignore, but the secrets still exist in git history.

### Option 1: BFG Repo-Cleaner (Recommended)
```bash
# Download BFG
curl -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Remove secrets from history
java -jar bfg.jar --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (coordinate with team)
git push origin --force --all
```

### Option 2: Filter-Branch
```bash
# Filter all branches
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch packages/api/.env packages/site-template/.env.local' \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

---

## ✅ Pre-Launch Security Checklist

- [ ] Rotate JWT_SECRET
- [ ] Rotate NETLIFY_TOKEN
- [ ] Rotate Cloudflare R2 credentials
- [ ] Rotate Google Places API key
- [ ] Set up Stripe webhook secret
- [ ] Update CORS_ORIGINS to production domains
- [ ] Remove secrets from git history
- [ ] Enable Railway deployment from clean branch
- [ ] Test all authentication flows
- [ ] Verify file uploads work with new R2 credentials
- [ ] Test email notifications (SendGrid or SMTP)
- [ ] Verify payment processing with Stripe

---

## 🆘 Emergency Contacts

If you suspect unauthorized access:
1. Rotate all secrets immediately
2. Check Railway logs for unusual activity
3. Review Netlify deploy logs
4. Audit database for unauthorized changes
5. Notify users if data was potentially compromised

---

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Netlify Personal Access Tokens](https://docs.netlify.com/cli/get-started/#obtain-a-token)
- [Cloudflare R2 API Tokens](https://developers.cloudflare.com/r2/api/s3/tokens/)

---

**Last Updated:** 2026-05-18  
**Criticality:** 🔴 URGENT - Complete before production launch

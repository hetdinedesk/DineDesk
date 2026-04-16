# Client Deployment Guide

This guide covers the complete process from creating a client in the CMS to getting their site live on Netlify.

## Prerequisites

- Railway API deployed and running
- Netlify account configured
- GitHub repository with site template code
- CMS admin access

## Step 1: Create Client in CMS

1. Log in to the CMS at `http://localhost:3000` (or your CMS URL)
2. Navigate to Clients section
3. Click "Add New Client"
4. Fill in client details:
   - Name (e.g., "Bella Vista")
   - Email
   - Domain (optional, can be added later)
   - Status: Set to "published" when ready
5. Save the client
6. Note the **Client ID** (e.g., `cmnrgxone0000fz466egls8aq`)

## Step 2: Configure Client Settings

1. Navigate to the newly created client
2. Add locations (at least one required)
3. Configure site settings:
   - Theme selection (e.g., `theme-d1`)
   - Colors and branding
   - Menu items and categories
   - Pages and content
4. Save all configurations

## Step 3: Configure Netlify Integration

### Option A: Automatic Netlify Site Creation (Recommended)

1. In the CMS, navigate to the client's Netlify Configuration
2. Click "Create Netlify Site"
3. Wait for site creation (may take 1-2 minutes)
4. Note the **Netlify Site ID** from the configuration

### Option B: Manual Netlify Site Creation

1. Log in to Netlify dashboard
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub repository
4. Configure build settings:
   - Build command: `npm install && npm run build`
   - Publish directory: `.next`
   - Base directory: `packages/site-template`
5. Click "Deploy site"
6. Note the **Netlify Site ID** from the site URL
7. **Create build hook manually:**
   - Go to Site → Settings → Build hooks
   - Click "Add build hook"
   - Name it "CMS Deploy" and select branch "main"
   - Save and copy the build hook URL
   - Paste it in CMS → Config → Netlify → Build Hook URL field
   - Save the configuration

## Step 4: Set Netlify Environment Variables

Go to: Netlify Dashboard → Site → Settings → Environment Variables

Set the following variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_CMS_API_URL` | `https://api-production-2c4e.up.railway.app/api` | All |
| `NEXT_PUBLIC_SITE_ID` | Your Client ID (from Step 1) | All |
| `SITE_TEMPLATE` | `theme-d1` (or your theme) | All |

**Important:** Do NOT use `SITE_ID` as it's a reserved Netlify variable.

## Step 5: Configure Railway CORS

1. Log in to Railway dashboard
2. Navigate to API service → Variables
3. Find or add `CORS_ORIGINS`
4. Set value to include Netlify domains:
   ```
   http://localhost:3000,http://localhost:3001,*.netlify.app
   ```
5. Trigger Railway redeploy to apply CORS changes

## Step 6: Trigger Netlify Deploy

### Automatic Deploy
- If using automatic Netlify creation, the site should auto-deploy after configuration

### Manual Deploy
1. Go to Netlify Dashboard → Site → Deploys
2. Click "Trigger deploy" → "Deploy branch" → "main"
3. Wait for build to complete (2-5 minutes)

## Step 7: Test Preview Site

1. Access the Netlify preview URL
2. Verify:
   - Site loads without errors
   - Client data appears (locations, menu, content)
   - All pages work correctly
   - Styling matches theme configuration

**Troubleshooting:**
- If site shows blank data: Check Netlify function logs for API errors
- If site crashes: Check for ESM module errors or build failures
- If 404 errors: Verify Client ID matches between CMS and Netlify env vars

## Step 8: Configure Custom Domain (Optional)

1. In Netlify, go to Site → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `bellavista.com`)
4. Configure DNS records as instructed by Netlify
5. Wait for SSL certificate to provision (may take up to 24 hours)

## Step 9: Go Live

1. Verify all client content is complete
2. Test all functionality (forms, links, booking, etc.)
3. Update client status to "published" in CMS
4. Share the live URL with the client

## Common Issues and Solutions

### Issue: Site shows blank/empty state
**Solution:** Check Netlify environment variables are set correctly, especially `NEXT_PUBLIC_SITE_ID`

### Issue: 502 error when fetching data
**Solution:** Verify Railway CORS includes `*.netlify.app` and Railway is deployed

### Issue: ESM module errors during build
**Solution:** Ensure `isomorphic-dompurify` is not used (use regular `dompurify` instead)

### Issue: Wrong client data showing
**Solution:** Check that no query parameter `?site=` is in the URL overriding env vars

### Issue: Build fails with dependency errors
**Solution:** Run `npm install` locally and commit updated `package-lock.json`

### Issue: CMS build/deploy fails with "Failed to trigger rebuild"
**Solution:** Build hook URL is invalid or missing. Recreate it:
1. Go to Netlify Dashboard → Site → Settings → Build hooks
2. Click "Add build hook"
3. Name it "CMS Deploy" and select branch "main"
4. Save and copy the new build hook URL
5. Update CMS → Config → Netlify with the new build hook URL
6. Save and try building from CMS again

## Checklist

- [ ] Client created in CMS
- [ ] Client ID noted
- [ ] Locations added
- [ ] Site content configured
- [ ] Netlify site created
- [ ] Netlify environment variables set
- [ ] Railway CORS configured
- [ ] Netlify deployed successfully
- [ ] Preview site tested
- [ ] Custom domain configured (optional)
- [ ] Client marked as published
- [ ] Live site shared with client

## Quick Reference

**Client ID Format:** `cmn[alphanumeric]+` (e.g., `cmnrgxone0000fz466egls8aq`)

**Railway API URL:** `https://api-production-2c4e.up.railway.app/api`

**Netlify Env Vars Required:**
- `NEXT_PUBLIC_CMS_API_URL`
- `NEXT_PUBLIC_SITE_ID`
- `SITE_TEMPLATE`

**Railway CORS Required:** `*.netlify.app`

## Support

If you encounter issues not covered in this guide:
1. Check Netlify function logs for specific error messages
2. Verify Railway API is running and accessible
3. Confirm environment variables match between CMS and Netlify
4. Check that client data exists in Railway database

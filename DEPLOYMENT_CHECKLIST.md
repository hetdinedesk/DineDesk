# 🚀 Railway Deployment Checklist - DineDesk

## ✅ **Configuration Status: COMPLETE**

### **Railway Configuration**
- ✅ `railway.toml` properly structured with `[build]` and `[deploy]` sections
- ✅ `buildCommand = "npx prisma generate"` in build section
- ✅ `startCommand = "npx prisma db push --accept-data-loss && node src/index.js"` in deploy section

### **Package.json Scripts**
- ✅ `build: "npx prisma generate"` - matches railway.toml
- ✅ `start: "node src/index.js"` - clean startup script
- ✅ `prisma:push: "npx prisma db push --accept-data-loss"` - proper flag

### **Prisma Schema**
- ✅ MenuItem model retains essential features: `sizes`, `addons`, `hasVariants`
- ✅ ItemCustomizationModal component functionality preserved
- ✅ Database schema ready for deployment with data loss handling

## 🔄 **Deployment Process**

### **What Railway Will Do:**
1. **Build Phase:**
   - Install dependencies
   - Run `npx prisma generate` (creates Prisma client)
   - No database operations during build

2. **Deploy Phase:**
   - Run `npx prisma db push --accept-data-loss` (applies schema changes)
   - Drop/recreate problematic columns if needed
   - Start application with `node src/index.js`

### **Expected Behavior:**
- ✅ Build will succeed (no database operations during build)
- ✅ Schema changes applied during deployment
- ✅ Menu customization features preserved
- ✅ Application starts successfully

## 🔧 **Environment Variables Required**

Ensure these are set in Railway:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to "production"
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SENDGRID_API_KEY` - SendGrid API key (if using email)

## 🚨 **Troubleshooting**

### **If Build Fails:**
1. Check Railway logs for specific error messages
2. Verify environment variables are properly set
3. Ensure DATABASE_URL is accessible from Railway

### **If Database Issues:**
1. The `--accept-data-loss` flag should handle column drops
2. Check if database is accessible from Railway
3. Verify Prisma schema matches database structure

### **If Application Won't Start:**
1. Check for missing environment variables
2. Verify database connection
3. Review application logs in Railway

## 📊 **Post-Deployment Verification**

### **Check These Endpoints:**
- `GET /` - API health check
- `GET /menu-items` - Verify menu items load
- `POST /orders` - Test order creation
- `GET /clients/:id/menu-items` - Test client-specific menu

### **Verify Features:**
- ✅ Menu items load with sizes and addons
- ✅ ItemCustomizationModal works properly
- ✅ Orders can be created with customizations
- ✅ Stripe payments process correctly
- ✅ Email notifications send (if configured)

## 🎯 **Success Indicators**

### **Build Success:**
- Railway shows "Build succeeded"
- No errors about Prisma operations during build
- Prisma client generated successfully

### **Deployment Success:**
- Application shows "Running" status
- Database schema updated successfully
- No startup errors in logs

### **Functional Success:**
- Menu items display with customization options
- Orders process correctly
- Payments work through Stripe
- Admin dashboard functions properly

## 🔄 **Next Steps**

### **After Successful Deployment:**
1. **Monitor logs** for any runtime errors
2. **Test all features** thoroughly
3. **Check database** to ensure schema is correct
4. **Verify performance** under load
5. **Set up monitoring** for production issues

### **Future Considerations:**
- Consider database migrations for production
- Set up backup and recovery procedures
- Implement proper logging and monitoring
- Plan for scaling and performance optimization

---

## 📞 **Quick Reference**

**Railway Commands:**
- Build: `npx prisma generate`
- Deploy: `npx prisma db push --accept-data-loss && node src/index.js`

**Key Files:**
- `packages/api/railway.toml` - Railway configuration
- `packages/api/package.json` - NPM scripts
- `packages/api/prisma/schema.prisma` - Database schema

**Environment Variables:**
- All secrets should be set in Railway dashboard
- Never commit secrets to repository

---

*This checklist ensures your DineDesk deployment is successful and all features work correctly.*
-- Add notifications field to SiteConfig table
ALTER TABLE "SiteConfig" 
ADD COLUMN "notifications" JSONB;

-- Log the migration
COMMENT ON COLUMN "SiteConfig"."notifications" IS 'Email notification settings for orders (SMTP config, customer receipts, restaurant notifications)';

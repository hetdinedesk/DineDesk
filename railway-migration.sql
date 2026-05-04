-- Railway Migration: Add notifications field to SiteConfig
-- Run this in your Railway database to add notifications support

ALTER TABLE "SiteConfig" 
ADD COLUMN IF NOT EXISTS "notifications" JSONB;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'SiteConfig' 
AND column_name = 'notifications';

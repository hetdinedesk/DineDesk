-- Add day/time scheduling fields to Special table
ALTER TABLE "Special"
  ADD COLUMN IF NOT EXISTS "activeDays"      JSONB,
  ADD COLUMN IF NOT EXISTS "activeTimeStart" TEXT,
  ADD COLUMN IF NOT EXISTS "activeTimeEnd"   TEXT;

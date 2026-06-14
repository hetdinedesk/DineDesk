-- Add tableNumber field to Order table
-- This allows displaying table numbers in operations without requiring table lookups

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "tableNumber" TEXT;

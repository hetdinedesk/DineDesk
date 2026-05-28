-- POS Integration Migration
-- Run this against your PostgreSQL database

-- Add POS push fields to Order
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "posOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "posPushAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "posPushLastError" TEXT;

-- POS Configuration table (one per client)
CREATE TABLE IF NOT EXISTS "POSConfig" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "posType" TEXT NOT NULL DEFAULT 'none',
  "encryptedCredentials" TEXT,
  "oauthAccessToken" TEXT,
  "oauthRefreshToken" TEXT,
  "oauthTokenExpiresAt" TIMESTAMP(3),
  "locationId" TEXT,
  "locationName" TEXT,
  "connected" BOOLEAN NOT NULL DEFAULT false,
  "connectionVerifiedAt" TIMESTAMP(3),
  "lastMenuSyncAt" TIMESTAMP(3),
  "lastOrderPushAt" TIMESTAMP(3),
  "menuItemsCount" INTEGER NOT NULL DEFAULT 0,
  "webhookSecret" TEXT,
  "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
  "autoPublishEnabled" BOOLEAN NOT NULL DEFAULT false,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "POSConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "POSConfig_clientId_key" ON "POSConfig"("clientId");
CREATE INDEX IF NOT EXISTS "POSConfig_clientId_idx" ON "POSConfig"("clientId");
CREATE INDEX IF NOT EXISTS "POSConfig_posType_idx" ON "POSConfig"("posType");

ALTER TABLE "POSConfig"
  DROP CONSTRAINT IF EXISTS "POSConfig_clientId_fkey";
ALTER TABLE "POSConfig"
  ADD CONSTRAINT "POSConfig_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Menu Sync Logs
CREATE TABLE IF NOT EXISTS "MenuSyncLog" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "posConfigId" TEXT NOT NULL,
  "syncType" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'success',
  "itemsAdded" INTEGER NOT NULL DEFAULT 0,
  "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
  "itemsRemoved" INTEGER NOT NULL DEFAULT 0,
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MenuSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MenuSyncLog_clientId_idx" ON "MenuSyncLog"("clientId");
CREATE INDEX IF NOT EXISTS "MenuSyncLog_posConfigId_idx" ON "MenuSyncLog"("posConfigId");
CREATE INDEX IF NOT EXISTS "MenuSyncLog_createdAt_idx" ON "MenuSyncLog"("createdAt");

ALTER TABLE "MenuSyncLog"
  DROP CONSTRAINT IF EXISTS "MenuSyncLog_posConfigId_fkey";
ALTER TABLE "MenuSyncLog"
  ADD CONSTRAINT "MenuSyncLog_posConfigId_fkey"
  FOREIGN KEY ("posConfigId") REFERENCES "POSConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order Push Queue
CREATE TABLE IF NOT EXISTS "OrderPushQueue" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "posConfigId" TEXT NOT NULL,
  "posType" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "maxAttempts" INTEGER NOT NULL DEFAULT 4,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),

  CONSTRAINT "OrderPushQueue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderPushQueue_status_nextRetryAt_idx" ON "OrderPushQueue"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "OrderPushQueue_clientId_idx" ON "OrderPushQueue"("clientId");
CREATE INDEX IF NOT EXISTS "OrderPushQueue_orderId_idx" ON "OrderPushQueue"("orderId");

ALTER TABLE "OrderPushQueue"
  DROP CONSTRAINT IF EXISTS "OrderPushQueue_posConfigId_fkey";
ALTER TABLE "OrderPushQueue"
  ADD CONSTRAINT "OrderPushQueue_posConfigId_fkey"
  FOREIGN KEY ("posConfigId") REFERENCES "POSConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

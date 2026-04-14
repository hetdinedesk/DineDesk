-- AlterTable: add nullable bannerId to Page
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "bannerId" TEXT;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_bannerId_fkey"
  FOREIGN KEY ("bannerId") REFERENCES "Banner"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Page_bannerId_idx" ON "Page"("bannerId");

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "widthPx" INTEGER,
ADD COLUMN     "heightPx" INTEGER;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "bannerId" TEXT;

-- CreateTable
CREATE TABLE "FooterSection" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FooterSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterLink" (
    "id" TEXT NOT NULL,
    "footerSectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pageId" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FooterLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FooterSection_clientId_idx" ON "FooterSection"("clientId");

-- CreateIndex
CREATE INDEX "FooterLink_footerSectionId_idx" ON "FooterLink"("footerSectionId");

-- CreateIndex
CREATE INDEX "Page_bannerId_idx" ON "Page"("bannerId");

-- AddForeignKey
ALTER TABLE "FooterSection" ADD CONSTRAINT "FooterSection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterLink" ADD CONSTRAINT "FooterLink_footerSectionId_fkey" FOREIGN KEY ("footerSectionId") REFERENCES "FooterSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterLink" ADD CONSTRAINT "FooterLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

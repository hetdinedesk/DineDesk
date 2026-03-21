/*
  Warnings:

  - Added the required column `updatedAt` to the `SiteConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN     "booking" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "homepage" JSONB,
ADD COLUMN     "reviews" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

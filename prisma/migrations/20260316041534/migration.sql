/*
  Warnings:

  - A unique constraint covering the columns `[registrationId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "registrationId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_registrationId_key" ON "Company"("registrationId");

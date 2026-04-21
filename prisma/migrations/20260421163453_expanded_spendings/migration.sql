/*
  Warnings:

  - Added the required column `currency` to the `Spendings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Spendings" ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "description" TEXT;

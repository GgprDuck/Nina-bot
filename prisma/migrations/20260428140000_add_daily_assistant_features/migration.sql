-- DropIndex
DROP INDEX IF EXISTS "ShoppingList_title_key";

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN "chatId" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "chatId" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Spendings" ADD COLUMN "chatId" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ChatSettings" (
    "chatId" BIGINT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "reportCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "morningDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "eveningDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSettings_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingList_chatId_idx" ON "ShoppingList"("chatId");

-- CreateIndex
CREATE INDEX "Recipe_chatId_idx" ON "Recipe"("chatId");

-- CreateIndex
CREATE INDEX "Spendings_chatId_createdAt_idx" ON "Spendings"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "Reminder_chatId_remindAt_idx" ON "Reminder"("chatId", "remindAt");

-- CreateIndex
CREATE INDEX "Reminder_completedAt_remindAt_idx" ON "Reminder"("completedAt", "remindAt");

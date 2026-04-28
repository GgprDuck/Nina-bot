-- CreateTable
CREATE TABLE "SharedSpace" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerChatId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedSpaceMember" (
    "id" TEXT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "sharedSpaceId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedSpaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedSpace_code_key" ON "SharedSpace"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SharedSpaceMember_chatId_key" ON "SharedSpaceMember"("chatId");

-- CreateIndex
CREATE INDEX "SharedSpaceMember_sharedSpaceId_idx" ON "SharedSpaceMember"("sharedSpaceId");

-- AddForeignKey
ALTER TABLE "SharedSpaceMember" ADD CONSTRAINT "SharedSpaceMember_sharedSpaceId_fkey" FOREIGN KEY ("sharedSpaceId") REFERENCES "SharedSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

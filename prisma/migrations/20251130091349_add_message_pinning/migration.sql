-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "messages_isPinned_idx" ON "messages"("isPinned");

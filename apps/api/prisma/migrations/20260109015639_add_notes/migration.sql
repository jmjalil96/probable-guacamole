-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_entityType_entityId_idx" ON "notes"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notes_entityType_entityId_deletedAt_idx" ON "notes"("entityType", "entityId", "deletedAt");

-- CreateIndex
CREATE INDEX "notes_createdById_idx" ON "notes"("createdById");

-- CreateIndex
CREATE INDEX "notes_createdAt_idx" ON "notes"("createdAt");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

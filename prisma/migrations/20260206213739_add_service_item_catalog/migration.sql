-- AlterTable
ALTER TABLE "budget_item" ADD COLUMN     "serviceItemId" TEXT;

-- CreateTable
CREATE TABLE "service_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_item_name_idx" ON "service_item"("name");

-- CreateIndex
CREATE INDEX "service_item_active_idx" ON "service_item"("active");

-- CreateIndex
CREATE INDEX "budget_item_serviceItemId_idx" ON "budget_item"("serviceItemId");

-- AddForeignKey
ALTER TABLE "budget_item" ADD CONSTRAINT "budget_item_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "service_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

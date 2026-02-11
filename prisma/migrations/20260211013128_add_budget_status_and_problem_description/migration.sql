-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "budget" ADD COLUMN     "problemDescription" TEXT,
ADD COLUMN     "status" "BudgetStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "budget_status_idx" ON "budget"("status");

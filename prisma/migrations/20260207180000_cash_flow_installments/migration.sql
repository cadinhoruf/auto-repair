-- AlterTable: add parcelamento fields to cash_flow
ALTER TABLE "cash_flow" ADD COLUMN "cashFlowGroupId" TEXT;
ALTER TABLE "cash_flow" ADD COLUMN "installmentIndex" INTEGER;

-- CreateIndex
CREATE INDEX "cash_flow_cashFlowGroupId_idx" ON "cash_flow"("cashFlowGroupId");

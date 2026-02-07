-- AlterTable: add activeOrganizationId to session
ALTER TABLE "session" ADD COLUMN "activeOrganizationId" TEXT;

-- CreateTable: organization
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable: member
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invitation
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- Insert default organization for existing data
INSERT INTO "organization" ("id", "name", "slug", "createdAt")
VALUES ('default-org-001', 'Oficina Padrão', 'oficina-padrao', CURRENT_TIMESTAMP);

-- Add admin user as owner member of the default organization
INSERT INTO "member" ("id", "userId", "organizationId", "role", "createdAt")
SELECT gen_random_uuid()::TEXT, u."id", 'default-org-001',
    CASE WHEN u."role" = 'admin' THEN 'owner' ELSE 'member' END,
    CURRENT_TIMESTAMP
FROM "user" u;

-- Update existing sessions to use the default organization
UPDATE "session" SET "activeOrganizationId" = 'default-org-001';

-- Step 1: Add organizationId columns as NULLABLE
ALTER TABLE "budget" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "cash_flow" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "client" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "service_item" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "service_order" ADD COLUMN "organizationId" TEXT;

-- Step 2: Fill existing rows with the default organization
UPDATE "budget" SET "organizationId" = 'default-org-001' WHERE "organizationId" IS NULL;
UPDATE "cash_flow" SET "organizationId" = 'default-org-001' WHERE "organizationId" IS NULL;
UPDATE "client" SET "organizationId" = 'default-org-001' WHERE "organizationId" IS NULL;
UPDATE "service_item" SET "organizationId" = 'default-org-001' WHERE "organizationId" IS NULL;
UPDATE "service_order" SET "organizationId" = 'default-org-001' WHERE "organizationId" IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE "budget" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "cash_flow" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "client" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "service_item" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "service_order" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "budget_organizationId_idx" ON "budget"("organizationId");
CREATE INDEX "cash_flow_organizationId_idx" ON "cash_flow"("organizationId");
CREATE INDEX "client_organizationId_idx" ON "client"("organizationId");
CREATE INDEX "service_item_organizationId_idx" ON "service_item"("organizationId");
CREATE INDEX "service_order_organizationId_idx" ON "service_order"("organizationId");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client" ADD CONSTRAINT "client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_order" ADD CONSTRAINT "service_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget" ADD CONSTRAINT "budget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_item" ADD CONSTRAINT "service_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

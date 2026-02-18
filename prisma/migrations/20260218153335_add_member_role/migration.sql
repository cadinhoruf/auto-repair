-- CreateTable
CREATE TABLE "member_role" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "member_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_role_memberId_idx" ON "member_role"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "member_role_memberId_role_key" ON "member_role"("memberId", "role");

-- AddForeignKey
ALTER TABLE "member_role" ADD CONSTRAINT "member_role_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

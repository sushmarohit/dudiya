-- CreateEnum
CREATE TYPE "IdentityDocumentType" AS ENUM ('AADHAAR', 'PAN', 'OTHER');

-- CreateEnum
CREATE TYPE "IdentityDocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'DECLINED');

-- AlterTable
ALTER TABLE "distributor_profiles" ADD COLUMN "identity_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN "identity_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "identity_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" "IdentityDocumentType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "original_name" TEXT,
    "declared_name" TEXT NOT NULL,
    "matched_against" TEXT NOT NULL,
    "status" "IdentityDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "decline_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_documents_user_id_status_idx" ON "identity_documents"("user_id", "status");

-- CreateIndex
CREATE INDEX "distributor_profiles_identity_verified_setup_status_idx" ON "distributor_profiles"("identity_verified", "setup_status");

-- AddForeignKey
ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing go-live distributors are treated as identity-verified
UPDATE "distributor_profiles"
SET "identity_verified" = true
WHERE "setup_status" = 'GO_LIVE' OR "approval_status" = 'APPROVED';

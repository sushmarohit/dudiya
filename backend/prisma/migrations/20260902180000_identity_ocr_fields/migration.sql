-- AlterTable
ALTER TABLE "identity_documents" ADD COLUMN IF NOT EXISTS "ocr_extracted_name" TEXT;
ALTER TABLE "identity_documents" ADD COLUMN IF NOT EXISTS "ocr_score" DOUBLE PRECISION;

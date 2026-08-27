-- CreateEnum
CREATE TYPE "ProductScope" AS ENUM ('GLOBAL', 'DISTRIBUTOR');
CREATE TYPE "ProductPromotionStatus" AS ENUM ('NONE', 'PRIVATE', 'PENDING_REVIEW', 'PROMOTED', 'REJECTED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "scope" "ProductScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "owner_distributor_id" TEXT,
ADD COLUMN     "promotion_status" "ProductPromotionStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "products_scope_active_idx" ON "products"("scope", "active");
CREATE INDEX "products_owner_distributor_id_active_idx" ON "products"("owner_distributor_id", "active");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_owner_distributor_id_fkey" FOREIGN KEY ("owner_distributor_id") REFERENCES "distributor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

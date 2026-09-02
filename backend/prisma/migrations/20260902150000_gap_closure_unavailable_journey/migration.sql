-- AlterEnum (Postgres 16)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DISTRIBUTOR_UNAVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_JOURNEY_STARTED';

-- AlterTable deliveries
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3);
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);

-- AlterTable delivery_items
ALTER TABLE "delivery_items" ADD COLUMN IF NOT EXISTS "estimated_arrival_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "distributor_unavailable_days" (
    "id" TEXT NOT NULL,
    "distributor_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distributor_unavailable_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "distributor_unavailable_days_distributor_id_date_key"
  ON "distributor_unavailable_days"("distributor_id", "date");
CREATE INDEX IF NOT EXISTS "distributor_unavailable_days_distributor_id_date_idx"
  ON "distributor_unavailable_days"("distributor_id", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'distributor_unavailable_days_distributor_id_fkey'
  ) THEN
    ALTER TABLE "distributor_unavailable_days"
      ADD CONSTRAINT "distributor_unavailable_days_distributor_id_fkey"
      FOREIGN KEY ("distributor_id") REFERENCES "distributor_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

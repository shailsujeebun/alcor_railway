CREATE TYPE "category_submission_status" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

ALTER TABLE "category"
ADD COLUMN "submission_status" "category_submission_status" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "suggested_by_user_id" TEXT,
ADD COLUMN "approved_by_user_id" TEXT,
ADD COLUMN "approved_at" TIMESTAMP(3),
ADD COLUMN "rejected_at" TIMESTAMP(3),
ADD COLUMN "rejection_reason" TEXT;

CREATE INDEX "category_submission_status_idx" ON "category"("submission_status");
CREATE INDEX "category_suggested_by_user_id_idx" ON "category"("suggested_by_user_id");

ALTER TABLE "category"
ADD CONSTRAINT "category_suggested_by_user_id_fkey"
FOREIGN KEY ("suggested_by_user_id") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "category"
ADD CONSTRAINT "category_approved_by_user_id_fkey"
FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

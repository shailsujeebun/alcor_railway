ALTER TABLE "listing"
ADD COLUMN "moderation_reason" TEXT,
ADD COLUMN "submitted_at" TIMESTAMP(3),
ADD COLUMN "moderated_at" TIMESTAMP(3);

-- Add completion_message column to tour_versions
ALTER TABLE "tour_versions" ADD COLUMN IF NOT EXISTS "completion_message" TEXT;

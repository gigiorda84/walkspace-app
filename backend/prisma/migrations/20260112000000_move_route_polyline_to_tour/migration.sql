-- AlterTable
-- Add route_polyline column to tours table
ALTER TABLE "tours" ADD COLUMN "route_polyline" TEXT;

-- Data Migration
-- Copy route_polyline from first tour_version to tour
UPDATE "tours" t
SET "route_polyline" = (
  SELECT tv."route_polyline"
  FROM "tour_versions" tv
  WHERE tv."tour_id" = t."id"
    AND tv."route_polyline" IS NOT NULL
  ORDER BY tv."created_at" ASC
  LIMIT 1
);

-- AlterTable
-- Drop route_polyline column from tour_versions table
ALTER TABLE "tour_versions" DROP COLUMN "route_polyline";

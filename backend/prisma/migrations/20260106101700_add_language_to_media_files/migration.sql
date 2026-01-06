-- AlterTable
ALTER TABLE "media_files" ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "tour_versions" ALTER COLUMN "starting_point_lat" DROP NOT NULL,
ALTER COLUMN "starting_point_lng" DROP NOT NULL;

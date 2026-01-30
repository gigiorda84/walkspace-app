-- AlterTable
ALTER TABLE "tour_versions" ADD COLUMN     "cover_image_file_id" TEXT;

-- AddForeignKey
ALTER TABLE "tour_versions" ADD CONSTRAINT "tour_versions_cover_image_file_id_fkey" FOREIGN KEY ("cover_image_file_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

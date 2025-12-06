-- AlterTable
ALTER TABLE "tours" ADD COLUMN     "video_file_id" TEXT;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_video_file_id_fkey" FOREIGN KEY ("video_file_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "media_files" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "original_filename" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

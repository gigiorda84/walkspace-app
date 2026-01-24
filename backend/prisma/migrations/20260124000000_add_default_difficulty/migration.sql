-- Add default_difficulty column to tours table
ALTER TABLE "tours" ADD COLUMN "default_difficulty" TEXT NOT NULL DEFAULT 'facile';

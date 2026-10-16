-- Add missing fields from the Prisma Class model.
ALTER TABLE "classes"
ADD COLUMN "assignedBookIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "classes"
ADD COLUMN "metadata" JSONB;

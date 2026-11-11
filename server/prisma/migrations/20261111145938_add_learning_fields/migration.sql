-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "hints" JSONB,
ADD COLUMN     "relatedSlugs" JSONB,
ADD COLUMN     "solutionJs" TEXT,
ADD COLUMN     "solutionNotes" TEXT,
ADD COLUMN     "targetComplexity" TEXT;

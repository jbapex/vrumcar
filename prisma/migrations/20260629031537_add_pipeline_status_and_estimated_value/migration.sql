-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'VISIT_SCHEDULED';
ALTER TYPE "LeadStatus" ADD VALUE 'PROPOSAL_SENT';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "estimated_value_cents" INTEGER;

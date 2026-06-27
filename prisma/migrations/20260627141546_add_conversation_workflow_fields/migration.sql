-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "resolved_by_user_id" TEXT;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

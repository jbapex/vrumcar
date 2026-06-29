-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "quoted_external_message_id" TEXT,
ADD COLUMN     "reactions" JSONB,
ADD COLUMN     "reply_to_message_id" TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

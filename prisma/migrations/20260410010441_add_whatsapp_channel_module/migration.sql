-- CreateEnum
CREATE TYPE "channel_provider" AS ENUM ('UAZAPI');

-- CreateEnum
CREATE TYPE "channel_instance_status" AS ENUM ('PENDING', 'QR_REQUIRED', 'CONNECTING', 'CONNECTED', 'DISCONNECTED', 'ERROR', 'INACTIVE');

-- CreateEnum
CREATE TYPE "conversation_status" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "message_direction" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'STICKER', 'SYSTEM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "max_channel_instances" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "channel_instances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "channel_provider" NOT NULL DEFAULT 'UAZAPI',
    "external_id" TEXT,
    "base_url" TEXT NOT NULL,
    "encrypted_token" TEXT,
    "phone_number" TEXT,
    "profile_name" TEXT,
    "status" "channel_instance_status" NOT NULL DEFAULT 'PENDING',
    "last_qr_code" TEXT,
    "last_error" TEXT,
    "last_connected_at" TIMESTAMP(3),
    "last_disconnected_at" TIMESTAMP(3),
    "webhook_secret" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "channel_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "channel_instance_id" TEXT NOT NULL,
    "external_chat_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_avatar" TEXT,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "lead_id" TEXT,
    "status" "conversation_status" NOT NULL DEFAULT 'OPEN',
    "assigned_to_id" TEXT,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "last_message_preview" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "external_message_id" TEXT,
    "external_sender" TEXT,
    "direction" "message_direction" NOT NULL,
    "type" "message_type" NOT NULL,
    "text" TEXT,
    "media_url" TEXT,
    "media_mime_type" TEXT,
    "media_caption" TEXT,
    "metadata" JSONB,
    "status" "message_status" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "sent_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channel_instances_organization_id_status_idx" ON "channel_instances"("organization_id", "status");

-- CreateIndex
CREATE INDEX "channel_instances_webhook_secret_idx" ON "channel_instances"("webhook_secret");

-- CreateIndex
CREATE INDEX "conversations_organization_id_status_last_message_at_idx" ON "conversations"("organization_id", "status", "last_message_at");

-- CreateIndex
CREATE INDEX "conversations_organization_id_lead_id_idx" ON "conversations"("organization_id", "lead_id");

-- CreateIndex
CREATE INDEX "conversations_organization_id_phone_number_idx" ON "conversations"("organization_id", "phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_channel_instance_id_external_chat_id_key" ON "conversations"("channel_instance_id", "external_chat_id");

-- CreateIndex
CREATE INDEX "messages_organization_id_conversation_id_created_at_idx" ON "messages"("organization_id", "conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_external_message_id_idx" ON "messages"("external_message_id");

-- AddForeignKey
ALTER TABLE "channel_instances" ADD CONSTRAINT "channel_instances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_instance_id_fkey" FOREIGN KEY ("channel_instance_id") REFERENCES "channel_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

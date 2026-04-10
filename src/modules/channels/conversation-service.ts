import type {
  Conversation,
  ConversationStatus,
  Message,
  MessageStatus,
  MessageType,
  Prisma,
} from '@prisma/client';
import { getTenantPrisma } from '@/lib/db/tenant';
import { decrypt } from '@/lib/crypto';
import { getInstanceClient } from './providers/uazapi/client';
import type { UazapiMessageData } from './providers/uazapi/types';
import { UazapiError } from './providers/uazapi/types';

export function isGroupChat(chatId: string): boolean {
  return chatId.includes('@g.us');
}

/**
 * Normaliza chatId do uazapi para dígitos do telefone.
 * Grupos (@g.us) não têm telefone único — retorna string vazia.
 */
export function normalizePhone(chatId: string): string {
  if (isGroupChat(chatId)) return '';
  const local = chatId.split('@')[0] ?? chatId;
  return local.replace(/\D/g, '');
}

export async function findOrCreateConversation(
  organizationId: string,
  channelInstanceId: string,
  params: {
    chatId: string;
    contactName?: string;
    contactAvatar?: string;
  },
): Promise<Conversation> {
  const db = getTenantPrisma(organizationId);

  const existing = await db.conversation.findFirst({
    where: {
      channelInstanceId,
      externalChatId: params.chatId,
      deletedAt: null,
    },
  });

  if (existing) {
    const data: Prisma.ConversationUpdateInput = {};
    if (
      params.contactName != null &&
      params.contactName !== existing.contactName
    ) {
      data.contactName = params.contactName;
    }
    const avatarIn =
      params.contactAvatar != null && params.contactAvatar.trim() !== ''
        ? params.contactAvatar.trim()
        : null;
    if (avatarIn && avatarIn !== existing.contactAvatar) {
      data.contactAvatar = avatarIn;
    }
    if (Object.keys(data).length > 0) {
      return db.conversation.update({
        where: { id: existing.id },
        data,
      });
    }
    return existing;
  }

  const phoneNumber = normalizePhone(params.chatId);
  const isGroup = isGroupChat(params.chatId);

  let leadId: string | null = null;
  if (!isGroup && phoneNumber) {
    const existingLead = await db.lead.findFirst({
      where: { phone: phoneNumber, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const newLead = await db.lead.create({
        data: {
          organizationId,
          name: params.contactName ?? `Contato ${phoneNumber}`,
          phone: phoneNumber,
          source: 'WHATSAPP',
          status: 'NEW',
          priority: 'MEDIUM',
        },
      });
      leadId = newLead.id;

      await db.leadInteraction.create({
        data: {
          organizationId,
          leadId: newLead.id,
          type: 'WHATSAPP_RECEIVED',
          content: 'Lead criado automaticamente via WhatsApp',
        },
      });
    }
  }

  const contactAvatar =
    params.contactAvatar != null && params.contactAvatar.trim() !== ''
      ? params.contactAvatar.trim()
      : null;

  return db.conversation.create({
    data: {
      organizationId,
      channelInstanceId,
      externalChatId: params.chatId,
      phoneNumber,
      contactName: params.contactName ?? null,
      contactAvatar,
      isGroup,
      leadId,
      status: 'OPEN',
    },
  });
}

export async function ingestIncomingMessage(
  organizationId: string,
  channelInstanceId: string,
  data: UazapiMessageData,
  contactInfo?: {
    avatarUrl?: string;
    name?: string;
    isGroup?: boolean;
  },
): Promise<Message | null> {
  const db = getTenantPrisma(organizationId);

  // Mapa de tipos do uazapi pro nosso enum interno.
  // O uazapi real usa PascalCase (ExtendedTextMessage, etc).
  // Mantemos também os formatos antigos da spec OpenAPI por
  // segurança (caso o uazapi mude o formato).
  const typeMap: Record<string, MessageType> = {
    // Formato real (PascalCase)
    Conversation: 'TEXT',
    ExtendedTextMessage: 'TEXT',
    ImageMessage: 'IMAGE',
    AudioMessage: 'AUDIO',
    VideoMessage: 'VIDEO',
    DocumentMessage: 'DOCUMENT',
    LocationMessage: 'LOCATION',
    ContactMessage: 'CONTACT',
    StickerMessage: 'STICKER',
    // Formato da spec OpenAPI (camelCase) — fallback
    conversation: 'TEXT',
    extendedTextMessage: 'TEXT',
    imageMessage: 'IMAGE',
    audioMessage: 'AUDIO',
    videoMessage: 'VIDEO',
    documentMessage: 'DOCUMENT',
    locationMessage: 'LOCATION',
    contactMessage: 'CONTACT',
    stickerMessage: 'STICKER',
  };

  const chatId = data.chatid as string | undefined;
  const messageId = data.messageid as string | undefined;
  const text =
    (data.text as string | undefined) ??
    (data.content?.text as string | undefined) ??
    '';
  const fromMe = (data.fromMe as boolean | undefined) ?? false;
  const messageType = (data.messageType as string | undefined) ?? 'unknown';
  const timestamp =
    (data.messageTimestamp as number | undefined) ?? Date.now();
  const senderName = (data.senderName as string | undefined) ?? null;

  if (!chatId) {
    console.warn('[channels] Ignoring message without chatid:', data);
    return null;
  }

  // Decisão de produto: ignorar mensagens de grupo.
  // Inbox do VrumCar é só pra conversas diretas (1:1) com clientes.
  // Se quiser processar grupos no futuro, criar feature flag.
  if (
    isGroupChat(chatId) ||
    data.isGroup === true ||
    contactInfo?.isGroup === true
  ) {
    return null;
  }

  const mappedType =
    messageType && typeMap[messageType] !== undefined
      ? typeMap[messageType]!
      : 'UNKNOWN';

  if (messageId) {
    const existing = await db.message.findFirst({
      where: { externalMessageId: messageId },
    });
    if (existing) return existing;
  }

  const avatarFromContact =
    contactInfo?.avatarUrl != null && contactInfo.avatarUrl.trim() !== ''
      ? contactInfo.avatarUrl.trim()
      : undefined;

  const conversation = await findOrCreateConversation(
    organizationId,
    channelInstanceId,
    {
      chatId,
      contactName: contactInfo?.name ?? senderName ?? undefined,
      contactAvatar: avatarFromContact,
    },
  );

  // Decide se o texto vai como conteúdo principal ou como caption de mídia
  const isMediaType = ['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'].includes(
    mappedType,
  );
  const messageText =
    text ||
    (data.content as { text?: string } | undefined)?.text ||
    '';

  const message = await db.message.create({
    data: {
      organizationId,
      conversationId: conversation.id,
      externalMessageId: messageId ?? null,
      externalSender: (data.sender as string | undefined) ?? null,
      direction: fromMe ? 'OUTBOUND' : 'INBOUND',
      type: mappedType,
      text: isMediaType ? null : messageText || null,
      mediaCaption: isMediaType ? messageText || null : null,
      status: 'DELIVERED',
      sentAt: new Date(timestamp),
      metadata: data as object,
    },
  });

  const preview =
    text.slice(0, 100) || `[${mappedType.toLowerCase()}]`;

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(timestamp),
      lastMessagePreview: preview,
      unreadCount: fromMe
        ? conversation.unreadCount
        : { increment: 1 },
    },
  });

  if (!fromMe && conversation.leadId) {
    await db.leadInteraction.create({
      data: {
        organizationId,
        leadId: conversation.leadId,
        type: 'WHATSAPP_RECEIVED',
        content: text.slice(0, 500) || `[${mappedType.toLowerCase()}]`,
      },
    });
    await db.lead.update({
      where: { id: conversation.leadId },
      data: { lastContactAt: new Date(timestamp) },
    });
  }

  return message;
}

/**
 * Atualiza o status de uma mensagem existente baseado no
 * evento messages_update do uazapi.
 *
 * Mapeia status do uazapi → nosso enum:
 * - "Sent" → SENT
 * - "Delivered" → DELIVERED
 * - "Read" → READ
 * - "Failed" → FAILED
 */
export async function updateMessageStatus(
  organizationId: string,
  externalMessageId: string,
  uazapiStatus: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);

  const statusMap: Record<string, MessageStatus> = {
    Sent: 'SENT',
    SENT: 'SENT',
    sent: 'SENT',
    Delivered: 'DELIVERED',
    DELIVERED: 'DELIVERED',
    delivered: 'DELIVERED',
    Read: 'READ',
    READ: 'READ',
    read: 'READ',
    Failed: 'FAILED',
    FAILED: 'FAILED',
    failed: 'FAILED',
  };

  const newStatus = statusMap[uazapiStatus];
  if (!newStatus) return;

  const message = await db.message.findFirst({
    where: { externalMessageId },
  });
  if (!message) return;

  const statusOrder: Record<MessageStatus, number> = {
    PENDING: 0,
    SENT: 1,
    DELIVERED: 2,
    READ: 3,
    FAILED: -1,
  };

  if (newStatus !== 'FAILED') {
    const currentOrder = statusOrder[message.status] ?? 0;
    const nextOrder = statusOrder[newStatus] ?? 0;
    if (nextOrder <= currentOrder) {
      return;
    }
  }

  const data: Prisma.MessageUpdateInput = { status: newStatus };
  if (newStatus === 'DELIVERED' && !message.deliveredAt) {
    data.deliveredAt = new Date();
  } else if (newStatus === 'READ' && !message.readAt) {
    data.readAt = new Date();
  } else if (newStatus === 'FAILED' && !message.failedAt) {
    data.failedAt = new Date();
  }

  await db.message.update({
    where: { id: message.id },
    data,
  });
}

export async function sendTextMessage(
  organizationId: string,
  userId: string,
  params: { conversationId: string; text: string },
): Promise<Message> {
  const db = getTenantPrisma(organizationId);

  const conversation = await db.conversation.findFirst({
    where: { id: params.conversationId, deletedAt: null },
    include: { channelInstance: true },
  });
  if (!conversation) throw new Error('Conversation not found');
  if (conversation.channelInstance.status !== 'CONNECTED') {
    throw new Error('Channel instance not connected');
  }
  if (!conversation.channelInstance.encryptedToken) {
    throw new Error('Channel instance has no token');
  }

  const message = await db.message.create({
    data: {
      organizationId,
      conversationId: conversation.id,
      direction: 'OUTBOUND',
      type: 'TEXT',
      text: params.text,
      status: 'PENDING',
      sentByUserId: userId,
    },
  });

  try {
    const token = decrypt(conversation.channelInstance.encryptedToken);
    const client = getInstanceClient(token);
    const result = await client.sendText({
      number: conversation.externalChatId,
      text: params.text,
    });

    const updated = await db.message.update({
      where: { id: message.id },
      data: {
        status: 'SENT',
        externalMessageId: result.messageid ?? null,
        sentAt: new Date(),
      },
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: params.text.slice(0, 100),
      },
    });

    if (conversation.leadId) {
      await db.leadInteraction.create({
        data: {
          organizationId,
          leadId: conversation.leadId,
          type: 'WHATSAPP_SENT',
          content: params.text.slice(0, 500),
          createdBy: userId,
        },
      });
      await db.lead.update({
        where: { id: conversation.leadId },
        data: { lastContactAt: new Date() },
      });
    }

    return updated;
  } catch (err) {
    const errorMessage =
      err instanceof UazapiError ? err.message : 'Unknown error';
    await db.message.update({
      where: { id: message.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage,
      },
    });
    throw err;
  }
}

export async function listConversations(
  organizationId: string,
  params: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const db = getTenantPrisma(organizationId);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;

  const where: Prisma.ConversationWhereInput = { deletedAt: null };
  if (params.status) {
    where.status = params.status as ConversationStatus;
  }
  if (params.search) {
    const digits = params.search.replace(/\D/g, '');
    where.OR = [
      { contactName: { contains: params.search, mode: 'insensitive' } },
      ...(digits ? [{ phoneNumber: { contains: digits } }] : []),
    ];
  }

  const [total, items] = await Promise.all([
    db.conversation.count({ where }),
    db.conversation.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, status: true } },
        channelInstance: { select: { id: true, name: true, status: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listMessages(
  organizationId: string,
  conversationId: string,
  params: { limit?: number; before?: Date } = {},
) {
  const db = getTenantPrisma(organizationId);
  const limit = params.limit ?? 50;

  return db.message.findMany({
    where: {
      conversationId,
      ...(params.before && { createdAt: { lt: params.before } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markConversationAsRead(
  organizationId: string,
  conversationId: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);
  await db.conversation.update({
    where: { id: conversationId },
    data: { unreadCount: 0 },
  });
}

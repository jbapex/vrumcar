import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import {
  findOrCreateConversation,
  ingestIncomingMessage,
  isGroupChat,
  normalizePhone,
} from '../conversation-service';

describe('conversation-service', () => {
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
        });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect().catch(() => {});
  });

  async function createTestOrg(suffix: string) {
    const t = Date.now();
    const org = await prisma.organization.create({
      data: {
        slug: `ch-conv-${suffix}-${t}`,
        name: `Channel Org ${suffix} ${t}`,
      },
    });
    createdOrgIds.push(org.id);
    return org;
  }

  async function createChannelInstance(orgId: string) {
    return prisma.channelInstance.create({
      data: {
        organizationId: orgId,
        name: 'WA Test',
        baseUrl: 'https://novo22.uazapi.com',
        webhookSecret: `whsec-${orgId.slice(0, 8)}`,
      },
    });
  }

  it('normalizePhone extrai dígitos de chatid 5541...@s.whatsapp.net', () => {
    expect(normalizePhone('5541999887766@s.whatsapp.net')).toBe(
      '5541999887766',
    );
  });

  it('normalizePhone retorna vazio pra chatid de grupo', () => {
    expect(normalizePhone('120363040620231794@g.us')).toBe('');
  });

  it('isGroupChat detecta @g.us', () => {
    expect(isGroupChat('x@g.us')).toBe(true);
    expect(isGroupChat('5541@s.whatsapp.net')).toBe(false);
  });

  it('findOrCreateConversation cria nova quando não existe', async () => {
    const org = await createTestOrg('newconv');
    const ch = await createChannelInstance(org.id);
    const chatId = `5541888776655@s.whatsapp.net`;
    const c = await findOrCreateConversation(org.id, ch.id, {
      chatId,
      contactName: 'Novo',
    });
    expect(c.id).toBeDefined();
    expect(c.externalChatId).toBe(chatId);
    const again = await prisma.conversation.count({
      where: { channelInstanceId: ch.id, externalChatId: chatId },
    });
    expect(again).toBe(1);
  });

  it('findOrCreateConversation retorna existente quando já existe', async () => {
    const org = await createTestOrg('existconv');
    const ch = await createChannelInstance(org.id);
    const chatId = `5541777665544@s.whatsapp.net`;
    const a = await findOrCreateConversation(org.id, ch.id, { chatId });
    const b = await findOrCreateConversation(org.id, ch.id, { chatId });
    expect(a.id).toBe(b.id);
  });

  it('findOrCreateConversation linka a lead existente por phone', async () => {
    const org = await createTestOrg('linklead');
    const ch = await createChannelInstance(org.id);
    const phone = `5541666${Date.now().toString().slice(-6)}`;
    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        name: 'Lead Existente',
        phone,
        source: 'WEBSITE',
        status: 'NEW',
        priority: 'MEDIUM',
      },
    });
    const c = await findOrCreateConversation(
      org.id,
      ch.id,
      {
        chatId: `${phone}@s.whatsapp.net`,
      },
    );
    expect(c.leadId).toBe(lead.id);
  });

  it('findOrCreateConversation cria lead novo automaticamente quando número desconhecido', async () => {
    const org = await createTestOrg('autolead');
    const ch = await createChannelInstance(org.id);
    const phone = `5541555${Date.now().toString().slice(-6)}`;
    const c = await findOrCreateConversation(org.id, ch.id, {
      chatId: `${phone}@s.whatsapp.net`,
      contactName: 'Desconhecido',
    });
    expect(c.leadId).toBeTruthy();
    const lead = await prisma.lead.findFirst({
      where: { id: c.leadId!, organizationId: org.id },
    });
    expect(lead?.phone).toBe(phone);
    const interactions = await prisma.leadInteraction.findMany({
      where: { leadId: c.leadId! },
    });
    expect(
      interactions.some((i) =>
        i.content.includes('Lead criado automaticamente'),
      ),
    ).toBe(true);
  });

  it('findOrCreateConversation NÃO cria lead pra grupo', async () => {
    const org = await createTestOrg('nogroup');
    const ch = await createChannelInstance(org.id);
    const c = await findOrCreateConversation(org.id, ch.id, {
      chatId: `120363999888777@g.us`,
      contactName: 'Grupo',
    });
    expect(c.isGroup).toBe(true);
    expect(c.leadId).toBeNull();
  });

  it('ingestIncomingMessage cria Message e atualiza Conversation', async () => {
    const org = await createTestOrg('ingest1');
    const ch = await createChannelInstance(org.id);
    const ts = Date.now();
    const chatId = `5541444${String(ts).slice(-6)}@s.whatsapp.net`;
    const msgId = `ext-msg-${ts}`;
    const m = await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: msgId,
      text: 'Olá mundo',
      fromMe: false,
      messageType: 'conversation',
      messageTimestamp: ts,
      senderName: 'Cliente',
    });
    expect(m).not.toBeNull();
    const conv = await prisma.conversation.findFirst({
      where: { channelInstanceId: ch.id, externalChatId: chatId },
    });
    expect(conv?.lastMessagePreview).toContain('Olá');
    expect(conv?.lastMessageAt).toBeTruthy();
  });

  it('ingestIncomingMessage incrementa unreadCount pra mensagens INBOUND', async () => {
    const org = await createTestOrg('unread-in');
    const ch = await createChannelInstance(org.id);
    const ts = Date.now();
    const chatId = `5541333${String(ts).slice(-6)}@s.whatsapp.net`;
    await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: `in-${ts}`,
      text: 'in',
      fromMe: false,
      messageType: 'conversation',
      messageTimestamp: ts,
    });
    const conv = await prisma.conversation.findFirst({
      where: { externalChatId: chatId },
    });
    expect(conv?.unreadCount).toBe(1);
  });

  it('ingestIncomingMessage NÃO incrementa unreadCount pra OUTBOUND', async () => {
    const org = await createTestOrg('unread-out');
    const ch = await createChannelInstance(org.id);
    const ts = Date.now();
    const chatId = `5541222${String(ts).slice(-6)}@s.whatsapp.net`;
    await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: `in2-${ts}`,
      text: 'primeira',
      fromMe: false,
      messageType: 'conversation',
      messageTimestamp: ts,
    });
    await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: `out-${ts}`,
      text: 'resposta',
      fromMe: true,
      messageType: 'conversation',
      messageTimestamp: ts + 1,
    });
    const conv = await prisma.conversation.findFirst({
      where: { externalChatId: chatId },
    });
    expect(conv?.unreadCount).toBe(1);
  });

  it('ingestIncomingMessage é idempotente (mesma messageId não duplica)', async () => {
    const org = await createTestOrg('idemp');
    const ch = await createChannelInstance(org.id);
    const ts = Date.now();
    const chatId = `5541111${String(ts).slice(-6)}@s.whatsapp.net`;
    const msgId = `same-${ts}`;
    const a = await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: msgId,
      text: 'x',
      fromMe: false,
      messageType: 'conversation',
      messageTimestamp: ts,
    });
    const b = await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: msgId,
      text: 'x',
      fromMe: false,
      messageType: 'conversation',
      messageTimestamp: ts,
    });
    expect(a?.id).toBe(b?.id);
    const count = await prisma.message.count({
      where: { externalMessageId: msgId },
    });
    expect(count).toBe(1);
  });

  it('ingestIncomingMessage cria LeadInteraction quando linkada a lead', async () => {
    const org = await createTestOrg('li-int');
    const ch = await createChannelInstance(org.id);
    const phone = `5541999${Date.now().toString().slice(-6)}`;
    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        name: 'Com WhatsApp',
        phone,
        source: 'WHATSAPP',
        status: 'NEGOTIATING',
        priority: 'HIGH',
      },
    });
    const chatId = `${phone}@s.whatsapp.net`;
    await findOrCreateConversation(org.id, ch.id, { chatId });
    const before = await prisma.leadInteraction.count({
      where: { leadId: lead.id, type: 'WHATSAPP_RECEIVED' },
    });
    const ts = Date.now();
    await ingestIncomingMessage(org.id, ch.id, {
      chatid: chatId,
      messageid: `li-${ts}`,
      text: 'Mensagem do cliente',
      fromMe: false,
      messageType: 'conversation',
      messageTimestamp: ts,
    });
    const after = await prisma.leadInteraction.count({
      where: { leadId: lead.id, type: 'WHATSAPP_RECEIVED' },
    });
    expect(after).toBeGreaterThan(before);
    const last = await prisma.leadInteraction.findFirst({
      where: { leadId: lead.id, type: 'WHATSAPP_RECEIVED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(last?.content).toContain('Mensagem do cliente');
  });
});

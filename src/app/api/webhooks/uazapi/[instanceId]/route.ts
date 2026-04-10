import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  ingestIncomingMessage,
  updateMessageStatus,
} from '@/modules/channels/conversation-service';
import type {
  UazapiIncomingWebhook,
  UazapiMessageData,
} from '@/modules/channels/providers/uazapi/types';

/**
 * Webhook endpoint que recebe eventos do uazapi.
 * URL: /api/webhooks/uazapi/[instanceId]?secret=XYZ
 *
 * Formato real do payload (capturado em produção 10/04/2026):
 * {
 *   "EventType": "messages" | "connection" | "messages_update",
 *   "instanceName": "...",
 *   "chat": { ... },
 *   "message": { ... }   // só para EventType=messages
 * }
 *
 * Fallback: spec OpenAPI antiga com `event` + `data`.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ instanceId: string }> },
) {
  const { instanceId } = await ctx.params;

  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (!secret) {
    return NextResponse.json({ error: 'Missing secret' }, { status: 401 });
  }

  const instance = await prisma.channelInstance.findFirst({
    where: {
      id: instanceId,
      webhookSecret: secret,
      deletedAt: null,
    },
  });

  if (!instance) {
    return NextResponse.json(
      { error: 'Invalid instance or secret' },
      { status: 401 },
    );
  }

  let payload: UazapiIncomingWebhook;
  try {
    payload = (await req.json()) as UazapiIncomingWebhook;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const eventTypeRaw = (payload.EventType ?? payload.event ?? '').toString();
    const eventType = eventTypeRaw.toLowerCase();

    if (eventType === 'messages' || eventType === 'message') {
      if (payload.message) {
        const msg = payload.message as UazapiMessageData;
        const chat = payload.chat;
        const enriched: UazapiMessageData = {
          ...msg,
          chatid:
            msg.chatid ?? chat?.wa_chatid ?? (chat?.id as string | undefined),
          isGroup: msg.isGroup ?? chat?.wa_isGroup,
          senderName:
            msg.senderName ??
            (chat?.wa_contactName as string | undefined) ??
            (chat?.wa_name as string | undefined) ??
            (chat?.name as string | undefined),
        };

        const chatData = payload.chat;
        const contactInfo = chatData
          ? {
              avatarUrl: chatData.imagePreview,
              name: chatData.wa_contactName ?? chatData.name,
              isGroup: chatData.wa_isGroup ?? false,
            }
          : undefined;

        await ingestIncomingMessage(
          instance.organizationId,
          instance.id,
          enriched,
          contactInfo,
        );
      } else if (
        payload.data &&
        typeof payload.data === 'object' &&
        payload.data !== null &&
        'chatid' in payload.data
      ) {
        await ingestIncomingMessage(
          instance.organizationId,
          instance.id,
          payload.data as UazapiMessageData,
        );
      }
    } else if (eventType === 'messages_update') {
      const msgData = payload.message as
        | { messageid?: string; status?: string }
        | undefined;
      if (msgData?.messageid && msgData.status) {
        await updateMessageStatus(
          instance.organizationId,
          msgData.messageid,
          msgData.status,
        );
      } else if (
        payload.data &&
        typeof payload.data === 'object' &&
        payload.data !== null &&
        'messageid' in payload.data &&
        'status' in payload.data
      ) {
        const d = payload.data as { messageid?: string; status?: string };
        if (d.messageid && d.status) {
          await updateMessageStatus(
            instance.organizationId,
            d.messageid,
            d.status,
          );
        }
      }
    } else if (eventType === 'connection') {
      await prisma.channelInstance.update({
        where: { id: instance.id },
        data: {
          status: 'CONNECTED',
          lastConnectedAt: new Date(),
          lastQrCode: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[uazapi-webhook] Error processing event:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' });
  }
}

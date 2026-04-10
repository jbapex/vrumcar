import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ingestIncomingMessage } from '@/modules/channels/conversation-service';
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

  // Valida secret na query string
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (!secret) {
    return NextResponse.json({ error: 'Missing secret' }, { status: 401 });
  }

  // Busca a instância (sem tenant scope porque o webhook não tem
  // contexto de auth — usa o secret pra validar)
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

  // Parse do body
  let payload: UazapiIncomingWebhook;
  try {
    payload = (await req.json()) as UazapiIncomingWebhook;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Roteamento por tipo de evento
  try {
    const eventTypeRaw = (payload.EventType ?? payload.event ?? '').toString();
    const eventType = eventTypeRaw.toLowerCase();

    if (eventType === 'messages' || eventType === 'message') {
      // Formato novo: message + chat no topo
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
        await ingestIncomingMessage(
          instance.organizationId,
          instance.id,
          enriched,
        );
      } else if (
        payload.data &&
        typeof payload.data === 'object' &&
        payload.data !== null &&
        'chatid' in payload.data
      ) {
        // Spec antiga: corpo em `data`
        await ingestIncomingMessage(
          instance.organizationId,
          instance.id,
          payload.data as UazapiMessageData,
        );
      }
    } else if (eventType === 'connection') {
      // Atualização de status da conexão.
      // No formato real, o status pode estar em chat.status ou
      // em outros campos. Por enquanto, marca como CONNECTED
      // quando recebe qualquer evento de connection (porque
      // o sync ativo já cuida do status detalhado).
      await prisma.channelInstance.update({
        where: { id: instance.id },
        data: {
          status: 'CONNECTED',
          lastConnectedAt: new Date(),
          lastQrCode: null,
        },
      });
    }
    // Outros eventos (messages_update, presence, etc) ignorados
    // por enquanto. Podem ser implementados depois.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[uazapi-webhook] Error processing event:', err);
    // Retorna 200 mesmo em erro pra evitar retry infinito do uazapi.
    // Erros internos a gente investiga via log.
    return NextResponse.json({ ok: false, error: 'Internal error' });
  }
}

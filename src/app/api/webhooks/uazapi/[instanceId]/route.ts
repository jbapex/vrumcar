import { prisma } from '@/lib/db';
import { ingestIncomingMessage } from '@/modules/channels/conversation-service';
import type {
  UazapiIncomingWebhook,
  UazapiMessageData,
} from '@/modules/channels/providers/uazapi/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook endpoint que recebe eventos do uazapi.
 * URL: /api/webhooks/uazapi/[instanceId]?secret=XYZ
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
    if (payload.event === 'message' || payload.event === 'messages') {
      const data = payload.data as UazapiMessageData;
      await ingestIncomingMessage(
        instance.organizationId,
        instance.id,
        data,
      );
    } else if (payload.event === 'connection') {
      const status = (payload.data as { status?: string })?.status;
      if (status === 'connected') {
        await prisma.channelInstance.update({
          where: { id: instance.id },
          data: {
            status: 'CONNECTED',
            lastConnectedAt: new Date(),
            lastQrCode: null,
          },
        });
      } else if (status === 'disconnected') {
        await prisma.channelInstance.update({
          where: { id: instance.id },
          data: {
            status: 'DISCONNECTED',
            lastDisconnectedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[uazapi-webhook] Error processing event:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' });
  }
}

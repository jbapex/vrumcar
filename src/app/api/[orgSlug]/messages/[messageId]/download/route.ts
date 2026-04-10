import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  downloadAndCacheMedia,
  MediaDownloadError,
} from '@/modules/channels/media-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/[orgSlug]/messages/[messageId]/download
 *
 * Trigger pra baixar e cachear mídia. Idempotente: se já cacheou,
 * retorna a URL existente. Se não, baixa do uazapi, salva no MinIO
 * e retorna a URL nova.
 *
 * Retorna { url, mimeType, sizeBytes, fileName }
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orgSlug: string; messageId: string }> },
) {
  const { orgSlug, messageId } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });
  if (!org || org.memberships.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, organizationId: org.id },
  });
  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  try {
    const updated = await downloadAndCacheMedia(messageId);
    return NextResponse.json({
      url: updated.mediaUrl,
      mimeType: updated.mediaMimeType,
      sizeBytes: updated.mediaSizeBytes,
      fileName: updated.mediaFileName,
    });
  } catch (err) {
    if (err instanceof MediaDownloadError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error('[media-download] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

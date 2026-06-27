import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendMediaMessage } from '@/modules/channels/conversation-service';

/**
 * POST /api/[orgSlug]/conversations/[conversationId]/send-media
 *
 * Body: FormData com:
 * - file: File (obrigatório)
 * - caption: string (opcional, só pra imagens)
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ orgSlug: string; conversationId: string }> },
) {
  const { orgSlug, conversationId } = await ctx.params;

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

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const caption = formData.get('caption');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const MAX_SIZE = 16 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máximo 16MB)' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const message = await sendMediaMessage(
      org.id,
      conversationId,
      session.user.id,
      {
        buffer,
        mimeType: file.type,
        originalName: file.name,
        sizeBytes: file.size,
      },
      caption ? String(caption) : undefined,
    );

    return NextResponse.json({
      ok: true,
      messageId: message.id,
    });
  } catch (err) {
    console.error('[send-media]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao enviar' },
      { status: 500 },
    );
  }
}

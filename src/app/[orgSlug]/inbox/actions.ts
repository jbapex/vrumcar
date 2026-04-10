'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  markConversationAsRead,
  sendTextMessage,
} from '@/modules/channels/conversation-service';
import { sendTextMessageSchema } from '@/modules/channels/schemas';

async function requireOrgAccess(orgSlug: string) {
  const session = await auth();
  if (!session?.user) redirect('/login');

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
    throw new Error('Forbidden');
  }
  return { org, userId: session.user.id };
}

export async function sendMessageAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = sendTextMessageSchema.safeParse({
    conversationId: raw.conversationId,
    text: raw.text,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Mensagem inválida');
  }

  try {
    await sendTextMessage(org.id, userId, parsed.data);
    revalidatePath(`/${orgSlug}/inbox/${parsed.data.conversationId}`);
    revalidatePath(`/${orgSlug}/inbox`);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Erro ao enviar mensagem',
    );
  }
}

export async function markAsReadAction(
  orgSlug: string,
  conversationId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);
  await markConversationAsRead(org.id, conversationId);
  revalidatePath(`/${orgSlug}/inbox`);
}

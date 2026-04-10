import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import {
  listConversations,
  listMessages,
} from '@/modules/channels/conversation-service';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ChatView } from '@/components/inbox/chat-view';
import { ConversationList } from '@/components/inbox/conversation-list';
import { InboxPoller } from '@/components/inbox/inbox-poller';
import { MarkConversationRead } from '@/components/inbox/mark-conversation-read';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; conversationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug, conversationId } = await params;

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
    notFound();
  }

  const db = getTenantPrisma(org.id);
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, deletedAt: null },
    include: {
      lead: { select: { id: true, name: true, status: true } },
      channelInstance: { select: { id: true, name: true, status: true } },
    },
  });

  if (!conversation) {
    notFound();
  }

  const messages = await listMessages(org.id, conversationId, { limit: 50 });

  const { items } = await listConversations(org.id, {
    page: 1,
    pageSize: 100,
  });

  const listItems: ConversationListItem[] = items.map((c) => ({
    id: c.id,
    contactName: c.contactName,
    contactAvatar: c.contactAvatar,
    phoneNumber: c.phoneNumber,
    lastMessagePreview: c.lastMessagePreview,
    lastMessageAt: c.lastMessageAt,
    unreadCount: c.unreadCount,
    status: c.status,
    leadId: c.leadId,
    lead: c.lead,
  }));

  const connectedChannels = await prisma.channelInstance.count({
    where: {
      organizationId: org.id,
      deletedAt: null,
      status: 'CONNECTED',
    },
  });

  return (
    <>
      <MarkConversationRead
        orgSlug={orgSlug}
        conversationId={conversationId}
      />
      <div className="flex min-h-[calc(100dvh-5rem)] flex-col md:flex-row md:overflow-hidden">
        <aside className="flex w-full flex-col border-b border-zinc-200 md:h-[calc(100dvh-5rem)] md:w-[min(100%,380px)] md:shrink-0 md:border-b-0 md:border-r dark:border-zinc-800">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h1 className="text-lg font-semibold tracking-tight">
              Atendimento
            </h1>
            <p className="text-muted-foreground text-xs">WhatsApp</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listItems.length === 0 ? (
              <div className="text-muted-foreground space-y-3 p-6 text-center text-sm">
                {connectedChannels === 0 ? (
                  <>
                    <p>Nenhuma conversa ainda.</p>
                    <Link
                      href={`/${orgSlug}/channels`}
                      className={cn(buttonVariants({ size: 'sm' }))}
                    >
                      Ir para Canais
                    </Link>
                  </>
                ) : (
                  <p>Aguardando mensagens…</p>
                )}
              </div>
            ) : (
              <ConversationList
                orgSlug={orgSlug}
                items={listItems}
                activeConversationId={conversationId}
              />
            )}
          </div>
        </aside>
        <main className="flex min-h-[50vh] min-w-0 flex-1 flex-col md:min-h-0">
          <ChatView
            orgSlug={orgSlug}
            conversation={{
              id: conversation.id,
              contactName: conversation.contactName,
              contactAvatar: conversation.contactAvatar,
              phoneNumber: conversation.phoneNumber,
              leadId: conversation.leadId,
              lead: conversation.lead,
            }}
            messages={messages}
          />
        </main>
      </div>
      <InboxPoller intervalMs={3000} />
    </>
  );
}

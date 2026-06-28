import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import {
  listConversations,
  listMessages,
  listTeamMembers,
} from '@/modules/channels/conversation-service';
import { syncChannelInstanceStatus } from '@/modules/channels/instance-service';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ChatView } from '@/components/inbox/chat-view';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationTabs } from '@/components/inbox/conversation-tabs';
import { InboxPoller } from '@/components/inbox/inbox-poller';
import { NotificationSound } from '@/components/inbox/notification-sound';
import { MarkConversationRead } from '@/components/inbox/mark-conversation-read';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

type InboxTab = 'inbox' | 'attending' | 'resolved';

function parseInboxTab(
  raw: string | string[] | undefined,
): InboxTab {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'attending' || v === 'resolved') return v;
  return 'inbox';
}

function parseSearch(
  raw: string | string[] | undefined,
): string | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v?.trim() || undefined;
}

function parseOnlyMine(
  raw: string | string[] | undefined,
): boolean {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'true';
}

export default async function InboxConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; conversationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug, conversationId } = await params;
  const sp = await searchParams;
  const tab = parseInboxTab(sp.tab);
  const search = parseSearch(sp.search);
  const onlyMine = parseOnlyMine(sp.mine);

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

  const membership = org.memberships[0]!;
  const userRole = membership.role;
  const userId = session.user.id;

  const db = getTenantPrisma(org.id);
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, deletedAt: null },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          cpf: true,
          status: true,
          notes: true,
          createdAt: true,
        },
      },
      channelInstance: { select: { id: true, name: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!conversation) {
    notFound();
  }

  let channelInstance = conversation.channelInstance;
  try {
    const synced = await syncChannelInstanceStatus(
      org.id,
      conversation.channelInstanceId,
    );
    channelInstance = {
      id: synced.id,
      name: synced.name,
      status: synced.status,
    };
  } catch (err) {
    console.error('[inbox] Failed to sync channel status:', err);
  }

  const messages = await listMessages(org.id, conversationId, { limit: 50 });

  const [
    conversationsResult,
    inboxCount,
    attendingCount,
    resolvedCount,
    teamMembers,
    inboundCount,
  ] = await Promise.all([
    listConversations(org.id, {
      tab,
      search,
      userId,
      userRole,
      onlyMine,
      page: 1,
      pageSize: 100,
    }),
    listConversations(org.id, {
      tab: 'inbox',
      userId,
      userRole,
      pageSize: 1,
    }),
    listConversations(org.id, {
      tab: 'attending',
      userId,
      userRole,
      onlyMine,
      pageSize: 1,
    }),
    listConversations(org.id, {
      tab: 'resolved',
      userId,
      userRole,
      onlyMine,
      pageSize: 1,
    }),
    listTeamMembers(org.id),
    prisma.message.count({
      where: {
        organizationId: org.id,
        direction: 'INBOUND',
      },
    }),
  ]);

  const listItems: ConversationListItem[] = conversationsResult.items.map(
    (c) => ({
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
      assignedTo: c.assignedTo,
      messages: c.messages,
    }),
  );

  const connectedChannels = await prisma.channelInstance.count({
    where: {
      organizationId: org.id,
      deletedAt: null,
      status: 'CONNECTED',
    },
  });

  const emptyMessages: Record<InboxTab, string> = {
    inbox: 'Nenhuma conversa na entrada.',
    attending: 'Nenhuma conversa em atendimento.',
    resolved: 'Nenhuma conversa resolvida.',
  };

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
          <ConversationTabs
            orgSlug={orgSlug}
            currentTab={tab}
            userRole={userRole}
            onlyMine={onlyMine}
            activeConversationId={conversationId}
            counts={{
              inbox: inboxCount.total,
              attending: attendingCount.total,
              resolved: resolvedCount.total,
            }}
          />
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
                  <p>{emptyMessages[tab]}</p>
                )}
              </div>
            ) : (
              <ConversationList
                orgSlug={orgSlug}
                items={listItems}
                activeConversationId={conversationId}
                tab={tab}
                onlyMine={onlyMine}
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
              channelInstance,
              createdAt: conversation.createdAt,
              lastMessageAt: conversation.lastMessageAt,
              assignedToId: conversation.assignedToId,
              assignedTo: conversation.assignedTo,
              status: conversation.status,
            }}
            messages={messages}
            teamMembers={teamMembers}
          />
        </main>
      </div>
      <InboxPoller intervalMs={3000} />
      <NotificationSound messageCount={inboundCount} />
    </>
  );
}

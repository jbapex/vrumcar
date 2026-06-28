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
import { InboxListEmpty } from '@/components/inbox/inbox-list-empty';
import { InboxSidebarHeader } from '@/components/inbox/inbox-sidebar-header';
import { InboxPoller } from '@/components/inbox/inbox-poller';
import { NotificationSound } from '@/components/inbox/notification-sound';
import { MarkConversationRead } from '@/components/inbox/mark-conversation-read';
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
      <div className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row">
        <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-white shadow-sm max-md:max-h-[45vh] md:w-[min(100%,400px)] md:max-h-full md:border-r md:border-zinc-200/80 dark:bg-zinc-950 dark:md:border-zinc-800">
          <InboxSidebarHeader connectedChannels={connectedChannels} />
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
              <InboxListEmpty
                orgSlug={orgSlug}
                message={emptyMessages[tab]}
                noChannels={connectedChannels === 0}
              />
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
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
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

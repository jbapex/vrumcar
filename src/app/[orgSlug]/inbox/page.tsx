import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listConversations, migrateConversationsFromRemovedChannels } from '@/modules/channels/conversation-service';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationTabs } from '@/components/inbox/conversation-tabs';
import { InboxEmptyPanel } from '@/components/inbox/inbox-empty-panel';
import { InboxListEmpty } from '@/components/inbox/inbox-list-empty';
import { InboxSidebarHeader } from '@/components/inbox/inbox-sidebar-header';
import { InboxPoller } from '@/components/inbox/inbox-poller';
import { NotificationSound } from '@/components/inbox/notification-sound';
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

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug } = await params;
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

  await migrateConversationsFromRemovedChannels(org.id);

  const connectedChannels = await prisma.channelInstance.count({
    where: {
      organizationId: org.id,
      deletedAt: null,
      status: 'CONNECTED',
    },
  });

  const [
    conversationsResult,
    inboxCount,
    attendingCount,
    resolvedCount,
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

  const emptyMessages: Record<InboxTab, string> = {
    inbox: 'Nenhuma conversa na entrada.',
    attending: 'Nenhuma conversa em atendimento.',
    resolved: 'Nenhuma conversa resolvida.',
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row">
      <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-white shadow-sm md:w-[min(100%,400px)] md:border-r md:border-zinc-200/80 dark:bg-zinc-950 dark:md:border-zinc-800">
        <InboxSidebarHeader connectedChannels={connectedChannels} />
        <ConversationTabs
          orgSlug={orgSlug}
          currentTab={tab}
          userRole={userRole}
          onlyMine={onlyMine}
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
              tab={tab}
              onlyMine={onlyMine}
            />
          )}
        </div>
      </aside>
      <InboxEmptyPanel />
      <InboxPoller intervalMs={3000} />
      <NotificationSound messageCount={inboundCount} />
    </div>
  );
}

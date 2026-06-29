import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  listConversations,
  migrateConversationsFromRemovedChannels,
} from '@/modules/channels/conversation-service';
import { getLeadTaskCounts } from '@/lib/inbox/list-meta';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { InboxEmptyPanel } from '@/components/inbox/inbox-empty-panel';
import { InboxPoller } from '@/components/inbox/inbox-poller';
import { InboxSidebar } from '@/components/inbox/inbox-sidebar';
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

function toListItem(
  c: Awaited<ReturnType<typeof listConversations>>['items'][number],
  taskCounts: Map<string, number>,
): ConversationListItem {
  return {
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
    channelName: c.channelInstance?.name,
    pendingTasks: c.leadId ? taskCounts.get(c.leadId) ?? 0 : 0,
    messages: c.messages,
  };
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

  const taskCounts = await getLeadTaskCounts(
    org.id,
    conversationsResult.items.map((c) => c.leadId),
  );
  const listItems = conversationsResult.items.map((c) =>
    toListItem(c, taskCounts),
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row">
      <InboxSidebar
        orgSlug={orgSlug}
        tab={tab}
        search={search}
        onlyMine={onlyMine}
        userRole={userRole}
        connectedChannels={connectedChannels}
        currentUserId={userId}
        items={listItems}
        counts={{
          inbox: inboxCount.total,
          attending: attendingCount.total,
          resolved: resolvedCount.total,
        }}
      />
      <InboxEmptyPanel />
      <InboxPoller intervalMs={3000} />
      <NotificationSound messageCount={inboundCount} />
    </div>
  );
}

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import {
  listConversations,
  listMessages,
  listTeamMembers,
  ensureConversationChannelActive,
  migrateConversationsFromRemovedChannels,
} from '@/modules/channels/conversation-service';
import { syncChannelInstanceStatus } from '@/modules/channels/instance-service';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ChatView } from '@/components/inbox/chat-view';
import { InboxPoller } from '@/components/inbox/inbox-poller';
import { InboxSidebar } from '@/components/inbox/inbox-sidebar';
import { NotificationSound } from '@/components/inbox/notification-sound';
import { MarkConversationRead } from '@/components/inbox/mark-conversation-read';
import { notFound, redirect } from 'next/navigation';
import {
  buildInboxConversationUrl,
  conversationInboxTab,
} from '@/lib/inbox/routing';

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
    messages: c.messages,
  };
}

const leadSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  cpf: true,
  status: true,
  notes: true,
  createdAt: true,
  interestVehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      salePriceCents: true,
    },
  },
} as const;

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

  await migrateConversationsFromRemovedChannels(org.id);

  const db = getTenantPrisma(org.id);
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, deletedAt: null },
    include: {
      lead: { select: leadSelect },
      channelInstance: { select: { id: true, name: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!conversation) {
    notFound();
  }

  await ensureConversationChannelActive(org.id, conversationId);

  const refreshed = await db.conversation.findFirst({
    where: { id: conversationId, deletedAt: null },
    include: {
      lead: { select: leadSelect },
      channelInstance: { select: { id: true, name: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!refreshed) {
    notFound();
  }

  const expectedTab = conversationInboxTab({
    status: refreshed.status,
    assignedToId: refreshed.assignedToId,
  });
  if (tab !== expectedTab) {
    redirect(
      buildInboxConversationUrl(orgSlug, conversationId, expectedTab, {
        onlyMine,
        search,
      }),
    );
  }

  let channelInstance = refreshed.channelInstance;
  try {
    const synced = await syncChannelInstanceStatus(
      org.id,
      refreshed.channelInstanceId,
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
    connectedChannels,
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
    prisma.channelInstance.count({
      where: {
        organizationId: org.id,
        deletedAt: null,
        status: 'CONNECTED',
      },
    }),
  ]);

  const listItems = conversationsResult.items.map(toListItem);

  return (
    <>
      <MarkConversationRead
        orgSlug={orgSlug}
        conversationId={conversationId}
      />
      <div className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row">
        <InboxSidebar
          orgSlug={orgSlug}
          tab={tab}
          search={search}
          onlyMine={onlyMine}
          userRole={userRole}
          connectedChannels={connectedChannels}
          items={listItems}
          activeConversationId={conversationId}
          className="max-md:max-h-[42vh] md:max-h-full"
          counts={{
            inbox: inboxCount.total,
            attending: attendingCount.total,
            resolved: resolvedCount.total,
          }}
        />
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ChatView
            orgSlug={orgSlug}
            conversation={{
              id: refreshed.id,
              contactName: refreshed.contactName,
              contactAvatar: refreshed.contactAvatar,
              phoneNumber: refreshed.phoneNumber,
              leadId: refreshed.leadId,
              lead: refreshed.lead,
              channelInstance,
              createdAt: refreshed.createdAt,
              lastMessageAt: refreshed.lastMessageAt,
              assignedToId: refreshed.assignedToId,
              assignedTo: refreshed.assignedTo,
              status: refreshed.status,
            }}
            messages={messages}
            teamMembers={teamMembers}
            currentUserId={userId}
          />
        </main>
      </div>
      <InboxPoller intervalMs={3000} />
      <NotificationSound messageCount={inboundCount} />
    </>
  );
}

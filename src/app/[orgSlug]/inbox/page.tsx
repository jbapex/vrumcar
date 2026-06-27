import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listConversations } from '@/modules/channels/conversation-service';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationTabs } from '@/components/inbox/conversation-tabs';
import { InboxPoller } from '@/components/inbox/inbox-poller';
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
    }),
  );

  const emptyMessages: Record<InboxTab, string> = {
    inbox: 'Nenhuma conversa na entrada.',
    attending: 'Nenhuma conversa em atendimento.',
    resolved: 'Nenhuma conversa resolvida.',
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col md:flex-row md:overflow-hidden">
      <aside className="flex w-full flex-col border-b border-zinc-200 md:h-[calc(100dvh-5rem)] md:w-[min(100%,380px)] md:shrink-0 md:border-b-0 md:border-r dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h1 className="text-lg font-semibold tracking-tight">Atendimento</h1>
          <p className="text-muted-foreground text-xs">WhatsApp</p>
        </div>
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
            <div className="text-muted-foreground space-y-3 p-6 text-center text-sm">
              {connectedChannels === 0 ? (
                <>
                  <p>Nenhuma conversa ainda.</p>
                  <p>Conecte um canal WhatsApp pra receber mensagens.</p>
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
              tab={tab}
              onlyMine={onlyMine}
            />
          )}
        </div>
      </aside>
      <main className="bg-muted/30 text-muted-foreground hidden min-h-[200px] flex-1 items-center justify-center p-8 md:flex">
        <p className="text-center text-sm">Selecione uma conversa</p>
      </main>
      <InboxPoller intervalMs={3000} />
    </div>
  );
}

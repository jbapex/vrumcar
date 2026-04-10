import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listConversations } from '@/modules/channels/conversation-service';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ConversationList } from '@/components/inbox/conversation-list';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  void searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug } = await params;

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

  const connectedChannels = await prisma.channelInstance.count({
    where: {
      organizationId: org.id,
      deletedAt: null,
      status: 'CONNECTED',
    },
  });

  const { items } = await listConversations(org.id, {
    page: 1,
    pageSize: 100,
  });

  const listItems: ConversationListItem[] = items.map((c) => ({
    id: c.id,
    contactName: c.contactName,
    phoneNumber: c.phoneNumber,
    lastMessagePreview: c.lastMessagePreview,
    lastMessageAt: c.lastMessageAt,
    unreadCount: c.unreadCount,
    status: c.status,
    leadId: c.leadId,
    lead: c.lead,
  }));

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col md:flex-row md:overflow-hidden">
      <aside className="flex w-full flex-col border-b border-zinc-200 md:h-[calc(100dvh-5rem)] md:w-[min(100%,380px)] md:shrink-0 md:border-b-0 md:border-r dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h1 className="text-lg font-semibold tracking-tight">Atendimento</h1>
          <p className="text-muted-foreground text-xs">WhatsApp</p>
        </div>
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
                <p>Aguardando mensagens…</p>
              )}
            </div>
          ) : (
            <ConversationList orgSlug={orgSlug} items={listItems} />
          )}
        </div>
      </aside>
      <main className="bg-muted/30 text-muted-foreground hidden min-h-[200px] flex-1 items-center justify-center p-8 md:flex">
        <p className="text-center text-sm">Selecione uma conversa</p>
      </main>
    </div>
  );
}

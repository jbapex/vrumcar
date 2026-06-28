import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationTabs } from '@/components/inbox/conversation-tabs';
import { InboxListEmpty } from '@/components/inbox/inbox-list-empty';
import { InboxSearch } from '@/components/inbox/inbox-search';
import { InboxSidebarHeader } from '@/components/inbox/inbox-sidebar-header';
import { cn } from '@/lib/utils';

type InboxTab = 'inbox' | 'attending' | 'resolved';

const EMPTY_MESSAGES: Record<InboxTab, string> = {
  inbox: 'Nenhuma conversa na entrada.',
  attending: 'Nenhuma conversa em atendimento.',
  resolved: 'Nenhuma conversa resolvida.',
};

interface Props {
  orgSlug: string;
  tab: InboxTab;
  search?: string;
  onlyMine: boolean;
  userRole: string;
  connectedChannels: number;
  items: ConversationListItem[];
  counts: { inbox: number; attending: number; resolved: number };
  activeConversationId?: string;
  className?: string;
}

export function InboxSidebar({
  orgSlug,
  tab,
  search,
  onlyMine,
  userRole,
  connectedChannels,
  items,
  counts,
  activeConversationId,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:w-[min(100%,380px)] md:border-r',
        className,
      )}
    >
      <InboxSidebarHeader connectedChannels={connectedChannels} />
      <InboxSearch
        orgSlug={orgSlug}
        tab={tab}
        onlyMine={onlyMine}
        activeConversationId={activeConversationId}
        initialSearch={search}
      />
      <ConversationTabs
        orgSlug={orgSlug}
        currentTab={tab}
        userRole={userRole}
        onlyMine={onlyMine}
        activeConversationId={activeConversationId}
        counts={counts}
        search={search}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <InboxListEmpty
            orgSlug={orgSlug}
            message={EMPTY_MESSAGES[tab]}
            noChannels={connectedChannels === 0}
          />
        ) : (
          <ConversationList
            orgSlug={orgSlug}
            items={items}
            activeConversationId={activeConversationId}
            tab={tab}
            onlyMine={onlyMine}
            search={search}
          />
        )}
      </div>
    </aside>
  );
}

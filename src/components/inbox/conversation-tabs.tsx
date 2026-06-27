import Link from 'next/link';

interface Props {
  orgSlug: string;
  currentTab: 'inbox' | 'attending' | 'resolved';
  counts: {
    inbox: number;
    attending: number;
    resolved: number;
  };
  /** Quando definido, mantém a conversa aberta ao trocar de aba */
  activeConversationId?: string;
}

export function ConversationTabs({
  orgSlug,
  currentTab,
  counts,
  activeConversationId,
}: Props) {
  const tabs: Array<{
    key: typeof currentTab;
    label: string;
    count: number;
  }> = [
    { key: 'inbox', label: 'Entrada', count: counts.inbox },
    { key: 'attending', label: 'Em atendimento', count: counts.attending },
    { key: 'resolved', label: 'Resolvidos', count: counts.resolved },
  ];

  const hrefForTab = (tabKey: string) => {
    if (activeConversationId) {
      return `/${orgSlug}/inbox/${activeConversationId}?tab=${tabKey}`;
    }
    return `/${orgSlug}/inbox?tab=${tabKey}`;
  };

  return (
    <div className="flex gap-1 border-b border-zinc-200 px-2 pt-2 dark:border-zinc-800">
      {tabs.map((tab) => {
        const active = tab.key === currentTab;
        return (
          <Link
            key={tab.key}
            href={hrefForTab(tab.key)}
            className={`flex items-center gap-2 rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? '-mb-px border-b-2 border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  active
                    ? 'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

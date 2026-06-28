import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
  orgSlug: string;
  currentTab: 'inbox' | 'attending' | 'resolved';
  counts: {
    inbox: number;
    attending: number;
    resolved: number;
  };
  userRole: string;
  onlyMine: boolean;
  activeConversationId?: string;
}

export function ConversationTabs({
  orgSlug,
  currentTab,
  counts,
  userRole,
  onlyMine,
  activeConversationId,
}: Props) {
  const tabs: Array<{
    key: typeof currentTab;
    label: string;
    shortLabel: string;
    count: number;
  }> = [
    { key: 'inbox', label: 'Entrada', shortLabel: 'Entrada', count: counts.inbox },
    {
      key: 'attending',
      label: 'Em atendimento',
      shortLabel: 'Atend.',
      count: counts.attending,
    },
    {
      key: 'resolved',
      label: 'Resolvidos',
      shortLabel: 'Resolv.',
      count: counts.resolved,
    },
  ];

  const hrefForTab = (tabKey: string, mine?: boolean) => {
    const params = new URLSearchParams();
    params.set('tab', tabKey);
    if (mine) params.set('mine', 'true');
    const qs = params.toString();
    if (activeConversationId) {
      return `/${orgSlug}/inbox/${activeConversationId}?${qs}`;
    }
    return `/${orgSlug}/inbox?${qs}`;
  };

  const showMineToggle = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

  return (
    <div className="shrink-0 space-y-2.5 border-b border-zinc-200/80 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex rounded-xl bg-zinc-100/90 p-1 dark:bg-zinc-900">
        {tabs.map((tab) => {
          const active = tab.key === currentTab;
          return (
            <Link
              key={tab.key}
              href={hrefForTab(tab.key, onlyMine || undefined)}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium transition-all sm:px-2',
                active
                  ? 'bg-white text-purple-700 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-800 dark:text-purple-300 dark:ring-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200',
              )}
            >
              <span className="hidden truncate sm:inline">{tab.label}</span>
              <span className="truncate sm:hidden">{tab.shortLabel}</span>
              {tab.count > 0 ? (
                <span
                  className={cn(
                    'min-w-[1.125rem] rounded-full px-1 py-0.5 text-center text-[10px] leading-none font-semibold',
                    active
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
                  )}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {showMineToggle ? (
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900">
            <Link
              href={hrefForTab(currentTab, true)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                onlyMine
                  ? 'bg-white text-purple-700 shadow-sm dark:bg-zinc-800 dark:text-purple-300'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
              )}
            >
              Minhas
            </Link>
            <Link
              href={hrefForTab(currentTab)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                !onlyMine
                  ? 'bg-white text-purple-700 shadow-sm dark:bg-zinc-800 dark:text-purple-300'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
              )}
            >
              Todas
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

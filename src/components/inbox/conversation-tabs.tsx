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
  search?: string;
}

export function ConversationTabs({
  orgSlug,
  currentTab,
  counts,
  userRole,
  onlyMine,
  activeConversationId,
  search,
}: Props) {
  const tabs: Array<{
    key: typeof currentTab;
    label: string;
    count: number;
  }> = [
    { key: 'inbox', label: 'Entrada', count: counts.inbox },
    { key: 'attending', label: 'Atendimento', count: counts.attending },
    { key: 'resolved', label: 'Resolvidos', count: counts.resolved },
  ];

  const hrefForTab = (tabKey: string, mine?: boolean) => {
    const params = new URLSearchParams();
    params.set('tab', tabKey);
    if (mine) params.set('mine', 'true');
    if (search?.trim()) params.set('search', search.trim());
    const qs = params.toString();
    // Trocar de aba mostra a lista; manter conversa só ao clicar na aba já ativa
    if (activeConversationId && tabKey === currentTab) {
      return `/${orgSlug}/inbox/${activeConversationId}?${qs}`;
    }
    return `/${orgSlug}/inbox?${qs}`;
  };

  const showMineToggle = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

  return (
    <div className="shrink-0 border-b border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 rounded-xl bg-zinc-100/90 p-0.5 dark:bg-zinc-900">
          {tabs.map((tab) => {
            const active = tab.key === currentTab;
            return (
              <Link
                key={tab.key}
                href={hrefForTab(tab.key, onlyMine || undefined)}
                title={tab.label}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-1.5 transition-all',
                  active
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-800 dark:text-purple-300 dark:ring-zinc-700'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                )}
              >
                <span className="truncate text-[11px] font-medium leading-tight">
                  {tab.label}
                </span>
                {tab.count > 0 ? (
                  <span
                    className={cn(
                      'mt-0.5 min-w-[1.125rem] rounded-full px-1 text-center text-[10px] leading-4 font-semibold',
                      active
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
                    )}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                ) : (
                  <span className="mt-0.5 text-[10px] leading-4 text-transparent">
                    0
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {showMineToggle ? (
          <div className="inline-flex shrink-0 flex-col rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900">
            <Link
              href={hrefForTab(currentTab, true)}
              className={cn(
                'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
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
                'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                !onlyMine
                  ? 'bg-white text-purple-700 shadow-sm dark:bg-zinc-800 dark:text-purple-300'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
              )}
            >
              Todas
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

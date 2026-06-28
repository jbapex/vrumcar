'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Props {
  orgSlug: string;
  tab: 'inbox' | 'attending' | 'resolved';
  onlyMine: boolean;
  activeConversationId?: string;
  initialSearch?: string;
}

function buildInboxPath(
  orgSlug: string,
  tab: string,
  onlyMine: boolean,
  search: string,
  activeConversationId?: string,
): string {
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (onlyMine) params.set('mine', 'true');
  if (search.trim()) params.set('search', search.trim());
  const qs = params.toString();
  const base = activeConversationId
    ? `/${orgSlug}/inbox/${activeConversationId}`
    : `/${orgSlug}/inbox`;
  return qs ? `${base}?${qs}` : base;
}

export function InboxSearch({
  orgSlug,
  tab,
  onlyMine,
  activeConversationId,
  initialSearch = '',
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pushSearch = (next: string) => {
    const path = buildInboxPath(
      orgSlug,
      tab,
      onlyMine,
      next,
      activeConversationId,
    );
    router.replace(path);
  };

  const handleChange = (next: string) => {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushSearch(next), 350);
  };

  const handleClear = () => {
    setValue('');
    pushSearch('');
  };

  return (
    <div className="relative shrink-0 px-3 pb-2">
      <Search
        className="pointer-events-none absolute top-1/2 left-6 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar nome ou telefone..."
        className="h-9 rounded-xl border-zinc-200/80 bg-zinc-50/80 pl-9 pr-8 text-sm dark:border-zinc-800 dark:bg-zinc-900/60"
        aria-label="Buscar conversas"
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-5 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Limpar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

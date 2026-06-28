'use client';

import { DEFAULT_QUICK_REPLIES } from '@/lib/inbox/quick-replies';
import { cn } from '@/lib/utils';

interface Props {
  disabled?: boolean;
  onSelect: (text: string) => void;
}

export function InboxQuickReplies({ disabled, onSelect }: Props) {
  return (
    <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {DEFAULT_QUICK_REPLIES.map((reply) => (
        <button
          key={reply.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply.text)}
          title={reply.text}
          className={cn(
            'shrink-0 rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/40 dark:hover:text-purple-200',
          )}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}

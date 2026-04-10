import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/format/relative-time';
import { formatPhone } from '@/lib/format/phone';
import { cn } from '@/lib/utils';
import type { ConversationStatus, LeadStatus } from '@prisma/client';
import { Users } from 'lucide-react';
import Link from 'next/link';

export type ConversationListItem = {
  id: string;
  contactName: string | null;
  phoneNumber: string;
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  status: ConversationStatus;
  leadId: string | null;
  lead: { id: string; name: string; status: LeadStatus } | null;
};

interface Props {
  orgSlug: string;
  items: ConversationListItem[];
  activeConversationId?: string;
}

export function ConversationList({
  orgSlug,
  items,
  activeConversationId,
}: Props) {
  return (
    <div className="flex flex-col divide-y border-r border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {items.map((c) => {
        const href = `/${orgSlug}/inbox/${c.id}`;
        const active = c.id === activeConversationId;
        const title =
          c.contactName?.trim() || formatPhone(c.phoneNumber) || c.phoneNumber;
        const preview = c.lastMessagePreview ?? 'Sem mensagens';
        const time = formatRelativeTime(c.lastMessageAt);

        return (
          <Link
            key={c.id}
            href={href}
            className={cn(
              'hover:bg-muted/80 flex gap-3 px-3 py-3 transition-colors',
              active && 'bg-primary/10',
            )}
          >
            <div className="bg-muted text-muted-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {title.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{title}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {time}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-muted-foreground truncate text-sm">
                  {preview}
                </p>
                {c.leadId ? (
                  <Users
                    className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                    aria-label="Tem lead vinculado"
                  />
                ) : null}
                {c.unreadCount > 0 ? (
                  <Badge variant="default" className="ml-auto shrink-0 px-1.5">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </Badge>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

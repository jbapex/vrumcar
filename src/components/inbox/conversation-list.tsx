import { ContactAvatar } from '@/components/inbox/contact-avatar';
import { formatRelativeTime } from '@/lib/format/relative-time';
import { formatPhone } from '@/lib/format/phone';
import {
  getConversationSlaLevel,
  slaLabel,
  slaTimeClass,
} from '@/lib/inbox/sla';
import { LEAD_STATUS_LABELS } from '@/lib/labels/leads';
import { cn } from '@/lib/utils';
import type { ConversationStatus, LeadStatus, MessageType } from '@prisma/client';
import { Smartphone, UserRound } from 'lucide-react';
import Link from 'next/link';

export type ConversationListItem = {
  id: string;
  contactName: string | null;
  contactAvatar: string | null;
  phoneNumber: string;
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  status: ConversationStatus;
  leadId: string | null;
  lead: { id: string; name: string; status: LeadStatus } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  channelName?: string;
  messages?: Array<{
    type: MessageType;
    text: string | null;
    mediaCaption: string | null;
    direction?: 'INBOUND' | 'OUTBOUND';
    createdAt?: Date | string;
  }>;
};

function getMessagePreview(conversation: ConversationListItem): string {
  const lastMsg = conversation.messages?.[0];
  if (lastMsg) {
    if (lastMsg.type === 'TEXT') return lastMsg.text ?? '';
    if (lastMsg.type === 'IMAGE')
      return `📷 ${lastMsg.mediaCaption ?? 'Foto'}`;
    if (lastMsg.type === 'AUDIO') return '🎤 Áudio';
    if (lastMsg.type === 'VIDEO') return '🎥 Vídeo';
    if (lastMsg.type === 'DOCUMENT') return '📎 Documento';
    if (lastMsg.type === 'STICKER') return '🏷️ Figurinha';
    if (lastMsg.type === 'LOCATION') return '📍 Localização';
    if (lastMsg.type === 'CONTACT') return '👤 Contato';
    return lastMsg.text ?? '';
  }
  return conversation.lastMessagePreview ?? 'Sem mensagens';
}

interface Props {
  orgSlug: string;
  items: ConversationListItem[];
  activeConversationId?: string;
  tab?: 'inbox' | 'attending' | 'resolved';
  onlyMine?: boolean;
  search?: string;
}

export function ConversationList({
  orgSlug,
  items,
  activeConversationId,
  tab,
  onlyMine,
  search,
}: Props) {
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950">
      {items.map((c) => {
        const params = new URLSearchParams();
        if (tab) params.set('tab', tab);
        if (onlyMine) params.set('mine', 'true');
        if (search?.trim()) params.set('search', search.trim());
        const qs = params.toString();
        const tabQuery = qs ? `?${qs}` : '';
        const href = `/${orgSlug}/inbox/${c.id}${tabQuery}`;
        const active = c.id === activeConversationId;
        const hasUnread = c.unreadCount > 0;
        const title =
          c.contactName?.trim() || formatPhone(c.phoneNumber) || c.phoneNumber;
        const preview = getMessagePreview(c);
        const time = formatRelativeTime(c.lastMessageAt);
        const lastDirection = c.messages?.[0]?.direction ?? null;
        const sla = getConversationSlaLevel({
          unreadCount: c.unreadCount,
          lastMessageAt: c.lastMessageAt,
          lastMessageDirection: lastDirection,
          status: c.status,
        });

        return (
          <Link
            key={c.id}
            href={href}
            className={cn(
              'group relative flex gap-3 border-b border-zinc-100 px-4 py-3.5 transition-colors dark:border-zinc-800/80',
              active
                ? 'bg-purple-50/90 hover:bg-purple-50/90 dark:bg-purple-950/25'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
              hasUnread && !active && 'bg-white',
            )}
          >
            {active ? (
              <span className="absolute inset-y-0 left-0 w-[3px] bg-purple-600" />
            ) : null}

            <ContactAvatar
              name={c.contactName}
              avatarUrl={c.contactAvatar}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'truncate text-[15px] text-zinc-900 dark:text-zinc-100',
                    hasUnread ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {title}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[11px]',
                    sla && sla !== 'ok'
                      ? slaTimeClass(sla)
                      : hasUnread
                        ? 'font-medium text-purple-600 dark:text-purple-400'
                        : 'text-zinc-400',
                  )}
                >
                  {time}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <p
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    hasUnread
                      ? 'font-medium text-zinc-700 dark:text-zinc-300'
                      : 'text-zinc-500 dark:text-zinc-400',
                  )}
                >
                  {preview}
                </p>

                {c.leadId ? (
                  <UserRound
                    className="h-3.5 w-3.5 shrink-0 text-purple-400"
                    aria-label="Tem lead vinculado"
                  />
                ) : null}

                {hasUnread ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-semibold text-white">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {sla && sla !== 'ok' ? (
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                      sla === 'critical'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
                    )}
                  >
                    {slaLabel(sla)}
                  </span>
                ) : null}
                {c.lead ? (
                  <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {LEAD_STATUS_LABELS[c.lead.status]}
                  </span>
                ) : null}
                {c.channelName ? (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Smartphone className="h-2.5 w-2.5" aria-hidden />
                    {c.channelName}
                  </span>
                ) : null}
                {c.assignedTo ? (
                  <span className="truncate text-[10px] text-zinc-400">
                    {c.assignedTo.name ?? c.assignedTo.email}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

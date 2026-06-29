'use client';

import { ContactAvatar } from '@/components/inbox/contact-avatar';
import { InboxQuickTaskButton } from '@/components/inbox/inbox-quick-task-button';
import { formatRelativeTime } from '@/lib/format/relative-time';
import { formatPhone } from '@/lib/format/phone';
import {
  getConversationSlaLevel,
  slaLabel,
  slaTimeClass,
} from '@/lib/inbox/sla';
import { LEAD_STATUS_LABELS } from '@/lib/labels/leads';
import { LEAD_STATUS_STYLES } from '@/lib/labels/lead-status-styles';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/components/inbox/conversation-list';
import { Car, CheckSquare, UserRound } from 'lucide-react';
import Link from 'next/link';

function getMessagePreview(conversation: ConversationListItem): string {
  const lastMsg = conversation.messages?.[0];
  if (lastMsg) {
    const prefix = lastMsg.direction === 'OUTBOUND' ? 'Você: ' : '';
    if (lastMsg.type === 'TEXT') return `${prefix}${lastMsg.text ?? ''}`;
    if (lastMsg.type === 'IMAGE')
      return `${prefix}📷 ${lastMsg.mediaCaption ?? 'Foto'}`;
    if (lastMsg.type === 'AUDIO') return `${prefix}🎤 Áudio`;
    if (lastMsg.type === 'VIDEO') return `${prefix}🎥 Vídeo`;
    if (lastMsg.type === 'DOCUMENT') return `${prefix}📎 Documento`;
    if (lastMsg.type === 'STICKER') return `${prefix}🏷️ Figurinha`;
    if (lastMsg.type === 'LOCATION') return `${prefix}📍 Localização`;
    if (lastMsg.type === 'CONTACT') return `${prefix}👤 Contato`;
    return `${prefix}${lastMsg.text ?? ''}`;
  }
  return conversation.lastMessagePreview ?? 'Sem mensagens';
}

function vehicleShortLabel(
  vehicle: NonNullable<ConversationListItem['lead']>['interestVehicle'],
): string | null {
  if (!vehicle) return null;
  const year = vehicle.year ? ` ${vehicle.year}` : '';
  return `${vehicle.brand} ${vehicle.model}${year}`;
}

interface Props {
  orgSlug: string;
  item: ConversationListItem;
  href: string;
  active: boolean;
  currentUserId: string;
  showChannelName: boolean;
}

export function ConversationListItemRow({
  orgSlug,
  item: c,
  href,
  active,
  currentUserId,
  showChannelName,
}: Props) {
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
  const vehicleLabel = c.lead?.interestVehicle
    ? vehicleShortLabel(c.lead.interestVehicle)
    : null;
  const pendingTasks = c.pendingTasks ?? 0;
  const statusStyle = c.lead
    ? LEAD_STATUS_STYLES[c.lead.status]
    : null;

  return (
    <div
      className={cn(
        'group relative flex border-b border-zinc-100 dark:border-zinc-800/80',
        active
          ? 'bg-purple-50/90 dark:bg-purple-950/25'
          : hasUnread
            ? 'bg-white dark:bg-zinc-950'
            : 'bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50',
      )}
    >
      {active ? (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-purple-600" />
      ) : null}

      <Link href={href} className="flex min-w-0 flex-1 gap-3 px-3 py-3 pr-1">
        <ContactAvatar
          name={c.contactName}
          avatarUrl={c.contactAvatar}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {statusStyle ? (
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', statusStyle.dot)}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    'truncate text-[15px] leading-tight text-zinc-900 dark:text-zinc-100',
                    hasUnread ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {title}
                </span>
              </div>
              {vehicleLabel ? (
                <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Car className="mr-0.5 inline size-3 -translate-y-px" />
                  {vehicleLabel}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={cn(
                  'text-[11px] leading-none',
                  sla && sla !== 'ok'
                    ? slaTimeClass(sla)
                    : hasUnread
                      ? 'font-medium text-purple-600 dark:text-purple-400'
                      : 'text-zinc-400',
                )}
              >
                {time}
              </span>
              {hasUnread ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-semibold text-white">
                  {c.unreadCount > 99 ? '99+' : c.unreadCount}
                </span>
              ) : null}
            </div>
          </div>

          <p
            className={cn(
              'mt-1 line-clamp-2 text-[13px] leading-snug',
              hasUnread
                ? 'font-medium text-zinc-700 dark:text-zinc-300'
                : 'text-zinc-500 dark:text-zinc-400',
            )}
          >
            {preview}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
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

            {c.lead && statusStyle ? (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                  statusStyle.badge,
                )}
              >
                {LEAD_STATUS_LABELS[c.lead.status]}
              </span>
            ) : null}

            {pendingTasks > 0 ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                <CheckSquare className="size-2.5" />
                {pendingTasks} tarefa{pendingTasks === 1 ? '' : 's'}
              </span>
            ) : null}

            {showChannelName && c.channelName ? (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                {c.channelName}
              </span>
            ) : null}

            {c.assignedTo ? (
              <span className="inline-flex max-w-[120px] items-center gap-0.5 truncate text-[10px] text-zinc-400">
                <UserRound className="size-2.5 shrink-0" />
                {c.assignedTo.name?.split(' ')[0] ?? c.assignedTo.email}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 flex-col items-center justify-center pr-2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        {c.leadId ? (
          <InboxQuickTaskButton
            orgSlug={orgSlug}
            conversationId={c.id}
            leadId={c.leadId}
            leadName={c.lead?.name ?? c.contactName}
            vehicleId={c.lead?.interestVehicleId ?? c.lead?.interestVehicle?.id}
            teamMembers={[]}
            currentUserId={currentUserId}
            pendingTasks={pendingTasks}
            variant="list"
          />
        ) : null}
      </div>
    </div>
  );
}

import { ConversationListItemRow } from '@/components/inbox/conversation-list-item';
import type { ConversationStatus, LeadStatus, MessageType } from '@prisma/client';

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
  lead: {
    id: string;
    name: string;
    status: LeadStatus;
    interestVehicleId?: string | null;
    interestVehicle?: {
      id: string;
      brand: string;
      model: string;
      year: number | null;
    } | null;
  } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  channelName?: string;
  pendingTasks?: number;
  messages?: Array<{
    type: MessageType;
    text: string | null;
    mediaCaption: string | null;
    direction?: 'INBOUND' | 'OUTBOUND';
    createdAt?: Date | string;
  }>;
};

interface Props {
  orgSlug: string;
  items: ConversationListItem[];
  activeConversationId?: string;
  currentUserId: string;
  connectedChannels: number;
  tab?: 'inbox' | 'attending' | 'resolved';
  onlyMine?: boolean;
  search?: string;
}

export function ConversationList({
  orgSlug,
  items,
  activeConversationId,
  currentUserId,
  connectedChannels,
  tab,
  onlyMine,
  search,
}: Props) {
  const showChannelName = connectedChannels > 1;

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

        return (
          <ConversationListItemRow
            key={c.id}
            orgSlug={orgSlug}
            item={c}
            href={href}
            active={c.id === activeConversationId}
            currentUserId={currentUserId}
            showChannelName={showChannelName}
          />
        );
      })}
    </div>
  );
}

export type InboxTab = 'inbox' | 'attending' | 'resolved';

export function conversationInboxTab(input: {
  status: string;
  assignedToId: string | null;
}): InboxTab {
  if (input.status === 'RESOLVED') return 'resolved';
  if (input.assignedToId) return 'attending';
  return 'inbox';
}

export function buildInboxConversationUrl(
  orgSlug: string,
  conversationId: string,
  tab: InboxTab,
  params?: { onlyMine?: boolean; search?: string },
): string {
  const sp = new URLSearchParams();
  sp.set('tab', tab);
  if (params?.onlyMine) sp.set('mine', 'true');
  if (params?.search?.trim()) sp.set('search', params.search.trim());
  return `/${orgSlug}/inbox/${conversationId}?${sp.toString()}`;
}

export function buildInboxListUrl(
  orgSlug: string,
  tab: InboxTab,
  params?: { onlyMine?: boolean; search?: string },
): string {
  const sp = new URLSearchParams();
  sp.set('tab', tab);
  if (params?.onlyMine) sp.set('mine', 'true');
  if (params?.search?.trim()) sp.set('search', params.search.trim());
  const qs = sp.toString();
  return qs ? `/${orgSlug}/inbox?${qs}` : `/${orgSlug}/inbox`;
}

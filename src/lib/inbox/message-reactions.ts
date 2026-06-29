export type MessageReactions = {
  contact?: string | null;
  agent?: string | null;
};

export const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

export function parseMessageReactions(raw: unknown): MessageReactions {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  return {
    contact: typeof obj.contact === 'string' ? obj.contact : null,
    agent: typeof obj.agent === 'string' ? obj.agent : null,
  };
}

export function reactionSummary(reactions: MessageReactions): string[] {
  const items: string[] = [];
  if (reactions.contact) items.push(reactions.contact);
  if (reactions.agent && reactions.agent !== reactions.contact) {
    items.push(reactions.agent);
  }
  return items;
}

import {
  parseMessageReactions,
  reactionSummary,
} from '@/lib/inbox/message-reactions';

export function MessageReactionsDisplay({
  reactions,
  isOutbound,
}: {
  reactions: unknown;
  isOutbound: boolean;
}) {
  const parsed = parseMessageReactions(reactions);
  const items = reactionSummary(parsed);
  if (items.length === 0) return null;

  return (
    <div
      className={`absolute -bottom-2 flex gap-0.5 ${
        isOutbound ? 'right-2' : 'left-2'
      }`}
    >
      {items.map((emoji) => (
        <span
          key={emoji}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-zinc-200 bg-white px-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

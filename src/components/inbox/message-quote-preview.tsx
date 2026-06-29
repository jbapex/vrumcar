import type { MessageType } from '@prisma/client';

export interface QuotedMessageLike {
  direction: string;
  type: MessageType | string;
  text: string | null;
  mediaCaption?: string | null;
}

export function getMessageSnippet(message: QuotedMessageLike): string {
  if (message.type === 'TEXT') {
    return message.text?.trim() || 'Mensagem';
  }
  if (message.type === 'IMAGE') {
    return `📷 ${message.mediaCaption?.trim() || 'Foto'}`;
  }
  if (message.type === 'AUDIO') return '🎤 Áudio';
  if (message.type === 'VIDEO') return '🎥 Vídeo';
  if (message.type === 'DOCUMENT') {
    return `📎 ${message.mediaCaption?.trim() || 'Documento'}`;
  }
  if (message.type === 'LOCATION') return '📍 Localização';
  if (message.type === 'CONTACT') return '👤 Contato';
  if (message.type === 'STICKER') return '🏷️ Figurinha';
  return message.text?.trim() || message.mediaCaption?.trim() || 'Mensagem';
}

interface QuoteProps {
  message: QuotedMessageLike;
  isOutboundBubble: boolean;
  compact?: boolean;
}

export function MessageQuotePreview({
  message,
  isOutboundBubble,
  compact,
}: QuoteProps) {
  const isReplyToOutbound = message.direction === 'OUTBOUND';
  const label = isReplyToOutbound ? 'Você' : 'Cliente';

  return (
    <div
      className={`mb-2 rounded-md border-l-4 px-2 py-1.5 ${
        isOutboundBubble
          ? 'border-emerald-600/70 bg-emerald-900/5'
          : 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/30'
      } ${compact ? 'text-[11px]' : 'text-xs'}`}
    >
      <p
        className={`font-semibold ${
          isOutboundBubble
            ? 'text-emerald-800'
            : 'text-purple-700 dark:text-purple-300'
        }`}
      >
        {label}
      </p>
      <p className="line-clamp-2 text-zinc-600 dark:text-zinc-300">
        {getMessageSnippet(message)}
      </p>
    </div>
  );
}
